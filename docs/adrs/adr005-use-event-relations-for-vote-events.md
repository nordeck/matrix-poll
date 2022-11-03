# ADR005: Use event relations for vote events

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

The poll widget with the result graphs and the PDF export needs a reliable data source to generate trustworthy results.
There are limitations on the data quality that the Widget API provides.
It is based on the Client's (ex: Element) local timeline, which provides all available state events (ex: polls), but might only provide a limited window of room events (ex: votes) of the complete room timeline.
This leads to the situation where the widget can't be sure whether all votes that are available on the homeserver are also made available by the Widget API.

> The [poll feature][msc3381-polls] that is part of the matrix specification makes use of [“Event Relationships”][msc2674-relationships] and the [“Serverside aggregations of message relationships”][msc2675-relation-server-aggregation] to connect and retrieve the respective vote events.
> [MSC3869][msc3869-widget-api-relations] brings this feature to the Widget API and enables us to provide a reliable and deterministic way to load all vote events in the widget.

We want to be able to use `readEventRelations` of [MSC3869][msc3869-widget-api-relations] instead of `receiveRoomEvents` to read the votes.
We will need to change some event structures, but these should not break old polls.
We accept that the described guarantees will only apply to polls that are created after this change.

### Reference: How do votes are connected to polls?

> The poll widget was designed before establishing the ADR process.
> While other ADRs (ex: [ADR001][adr001] or [ADR004][adr004]) describe details of the `net.nordeck.poll` state event, this gives a brief primer on how the votes are implemented.

Given a started poll:

```yaml
type: 'net.nordeck.poll'
state_key: '<unique-poll-id>'
room_id: '!my-room:…'
content:
  question: 'question'
  answers:
    - { 'id': '1', 'label': 'Yes' }
    - { 'id': '2', 'label': 'No' }
    - { 'id': '3', 'label': 'Abstain' }
  duration: 1
  startTime: '2022-01-01T15:20:23Z'
  # introduced by ADR004
  endTime: '2022-01-01T15:21:23Z'
  #…
event_id: '$…'
#…
```

Each voter appends a `net.nordeck.poll.vote` room event to the timeline:

```yaml
# the type of event
type: 'net.nordeck.poll.vote'

# the room of the event
room_id: '!my-room:…'

# the sender of the event. this represents the “voter”
sender: '@user-id'

# the time of the event creation. this represents the time of the vote.
origin_server_ts: 1641046834472

content:
  # the id of the `net.nordeck.poll` state event that this vote belongs to.
  pollId: '<unique-poll-id>'

  # the id of the answer. in this example the user selected “No”.
  answerId: '2'

# other unrelated event metadata
event_id: '$event-id'
```

Each vote event references a poll state event and the selected answer.
The `origin_server_ts` is set by the homeserver and represents the voting time.
In general, only votes between `startDate` and `endDate` are valid.
[ADR002][adr002] describes how the vote evaluation works in detail.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

1. We will emit a new `net.nordeck.poll.start` event when a poll is started:

   ```yaml
   # the type of event
   type: 'net.nordeck.poll.start'

   # the room of the event
   room_id: '!my-room:…'

   # the user that started the poll.
   sender: '@user-id'

   # the time of the event creation. we don't use it for anything yet.
   origin_server_ts: 0

   # the id of this event. it will be the target for all event relations.
   event_id: '<poll-start-event-id>'

   # empty content. can be extended in the future.
   content: {}
   #…
   ```

2. We will store the reference to the start event in the poll event:

   ```diff
     type: 'net.nordeck.poll'
     state_key: '<unique-poll-id>'
     room_id: '!my-room:…'
     content:
       question: 'question'
       answers:
         - { 'id': '1', 'label': 'Yes' }
         - { 'id': '2', 'label': 'No' }
         - { 'id': '3', 'label': 'Abstain' }
       duration: 1
       startTime: '2022-01-01T15:20:23Z'
   +   # the event_id of the start event
   +   startEventId: '<poll-start-event-id>'
       endTime: '2022-01-01T15:21:23Z'
       #…
     event_id: '$…'
   #…
   ```

3. We will change the vote events to relate to the poll start event.
   We will keep the `pollId` field for backwards compatibility reasons:

   ```diff
     type: 'net.nordeck.poll.vote'
     room_id: '!my-room:…'
     sender: '@user-id'
     origin_server_ts: 0
     content:
       pollId: '<unique-poll-id>'
       answerId: '2'

   +   # m.relates_to by MSC2674
   +   m.relates_to:
   +     # m.reference by MSC3267
   +     rel_type: 'm.reference'
   +
   +     # the id of the start event
   +     event_id: '<poll-start-event-id>'

     event_id: '$event-id'
     #…
   ```

If a poll event contains a `startEventId`, we won't include any vote that doesn't include a reference to the start event.

```
┌────────────────┐                ┌──────────────────────┐
│                │  startEventId  │                      │
│net.nordeck.poll├───────────────►│net.nordeck.poll.start│
│                │                │                      │
└────────────────┘                └──────────────────────┘
                                       ▲
                                       │
                                       │ m.relates_to: m.reference
                                       │
                                       │
                                       │           ┌─────────────────────┐
                                       │           │                     │
                                       ├───────────┤net.nordeck.poll.vote│
                                       │           │                     │
                                       │           └─────────────────────┘
                                       │
                                       │           ┌─────────────────────┐
                                       │           │                     │
                                       ├───────────┤net.nordeck.poll.vote│
                                       │           │                     │
                                       │           └─────────────────────┘
                                       │
                                       │           ┌─────────────────────┐
                                       │           │                     │
                                       └───────────┤net.nordeck.poll.vote│
                                                   │                     │
                                                   └─────────────────────┘
```

### Alternatives

**Relate to the state event:** We could relate the votes to the `event_id` of the poll state event.
Since editing the state event will lead to a new event with a different `event_id`, this would invalidate all previous votes.
This might be tolerable, but since there are valid reasons for editing a poll after starting it (see [ADR004][adr004]), this isn't a good option.
We could use the `unsigned.replaces_state` field and recursively read all previous state events, however, this would increase the amount of API calls for each individual poll.

**Use the `origin_server_ts` of the start event as start time:** We could replace the `startTime` field with the `origin_server_ts` of the start poll field.
We don't have a use case that would require such a change at the moment.
So given it being a breaking change, we don't want to change it now.
However, we might decide to do this in a future change, when the poll start event has matured and we can expect that all created polls have a poll start event.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

This change will add the restriction that votes are only possible once the poll is started, because only then the id of the poll start event is known.
This is the intended behavior and a welcomed change.

### Backwards compatibility

We don't want to break polls that were run before this change was applied.
So we will keep accepting votes without the `m.relates_to` relation given the `startEventId` is missing in the poll event.

### Access the content of the start event

The response of the [`/relations/{eventId}` endpoint][spec-relations-endpoint] (that is used by [MSC3869][msc3869-widget-api-relations]) includes an `original_event` field in the Synapse implementation, whith was [not added](https://github.com/matrix-org/matrix-spec/pull/1062#discussion_r886263442) to the specification.
This isn't problematic since the `net.nordeck.poll.start` event doesn't include any content yet and the existing endpoint fails if the event doesn't exists.
If that should change in the future, the Widget API might need to be extended to be able to access the [`/event/{eventId}` endpoint][spec-event-endpoint] to receive the event.

### Error handling

Referencing a `net.nordeck.poll.start` room event from a state event isn't without risk because the referenced event might not be present anymore.

There are four scenarios that can trigger this case:

1. A user redacted the event. It is still returned by the relations endpoint, though in the redacted state.

2. A user redacted the event and the retention of the homeserver pruned the event (see [`redaction_retention_period` or Synapse](https://matrix-org.github.io/synapse/latest/usage/configuration/config_documentation.html#redaction_retention_period)). The relations endpoint will throw an “event not found” error.

3. The event is present, but the user misses the encryption keys for the event.

4. The event is present, but due to the history visibility configured in the room, the event is not available. The relations endpoint will throw a “not authorized” error.

None of these scenarios can be ruled out reliably.

- 1\. & 2. could be avoided by increasing the power level of redactions for own/other events so nobody can redact it.
  However, the globality of this settings reduces the moderation features of the Matrix specification.
  An alternative might be a custom Synapse module to deny the deletion of these events if needed.

- 3\. is always a possibility in encrypted rooms.
  One can't guarantee that all users have the keys for the complete history.
  This might be acceptable in our setting, since all users should be in a room before a poll started.
  However, this might be an issue for guest users, especially if they join a room without prior invitation (see also [this element issue](https://github.com/vector-im/element-web/issues/21251)).
  But guest access will propbaly be done in rooms with `join_rule: public`, which shouldn't be encrypted [in the first place](https://www.uhoreg.ca/blog/20170910-2110#why-wont-all-rooms-be-encrypted).

- 4\. can be avoided by defaulting all rooms to use `history_visibility: shared`.

All of these problems are not specific to the change of introducing a start event but were also present in the old implementation.
However, the fact that a start event always precedes any vote event, can serve as an indicator that the data is incomplete or invalid.
We can thus warn the user that the data for this poll might be incomplete.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

[adr001]: ./adr001-poll-group-membership.md
[adr002]: ./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md
[adr004]: ./adr004-polls-without-duration.md
[msc2674-relationships]: https://github.com/matrix-org/matrix-spec-proposals/pull/2674
[msc2675-relation-server-aggregation]: https://github.com/matrix-org/matrix-spec-proposals/pull/2675
[msc3267-reference-relation]: https://github.com/matrix-org/matrix-spec-proposals/pull/3267
[msc3381-polls]: https://github.com/matrix-org/matrix-spec-proposals/pull/3381
[msc3869-widget-api-relations]: https://github.com/matrix-org/matrix-spec-proposals/pull/3869
[spec-event-endpoint]: https://spec.matrix.org/v1.3/client-server-api/#get_matrixclientv3roomsroomideventeventid
[spec-relations-endpoint]: https://spec.matrix.org/v1.3/client-server-api/#get_matrixclientv1roomsroomidrelationseventid

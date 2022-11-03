# ADR001: Poll Group Membership

Status: accepted

> This ADR was updated by:
>
> - [ADR002](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md)

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

The poll widget can be added to any room.
Administrators or moderators can create polls and all (or selected) members in a room can vote.
Currently, all votes are only stored as individual votes.
However, there should also be the option to associate the votes with the group that a user is a member of (ex: a policital party).
This feature is called “grouped voting”.

The widget needs to have a list of available groups and the membership of each user to these groups.
A user can only be a member of a single group at a time, but can change the groups over time.

There are different options for implementation: [Matrix Spaces](https://github.com/matrix-org/matrix-doc/pull/1772), dedicated state events, or third-party group storage.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will define a new State Event that describes the groups.
Each group includes a list of members.
These memberships are only valid if a user is a member of the room (i.e. `m.room.member` with `membership: join` or `membership: invite`).
The editor (i.e. the poll widget) will ensure that a user is only in a single group at the same time.
~~If a user leaves a group, the leave date is remembered to establish a minimal historical record.~~ (Replaced by [ADR002](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md).)

We will use the following state event:

```yaml
{
  # a new type of state event.
  type: 'net.nordeck.poll.group',
  # a unique id for each group (per room).
  state_key: '<unique-id>',
  # the room of the group.
  room_id: '!my-room:…',
  # the metadata of the group.
  content: {
      # the name of the group.
      abbreviation: 'Die Durchsichtige Partei',
      # the color of the group.
      color: '#ffffff00',
      # a list of all group members.
      members: {
          # the ID of the user.
          '@user:test.de': {
              # the date when the user joined the group.
              # (deleted in ADR002)
              # joinDate: '2022-01-01T00:00:00Z',

              # the date when the user left (or will leave)
              # the group. if omitted, the user is a member
              # of a group indefinitely.
              # (deleted in ADR002)
              # leaveDate: '2022-12-01T00:00:00Z',

              # the role of the member. can be one of 'delegate' and
              # 'representative'. defaults to 'delegate' if missing.
              # (introduced in ADR002)
              memberRole: 'delegate',
            },
        },
    },
  # other event data
  event_id: '$…',
  # …
}
```

All groups are only valid in the room that hosts the polls.

> In a future extension, we will add the option to reuse groups from another room.
> This might be done with a new entry in the `net.nordeck.poll.settings` event.

We will create a management interface to create and edit groups.
This is only available if the user has the required power level.

### Alternatives

There are alternatives that were discarded during the design of this feature:

1. **Matrix Spaces**:
   We could use spaces and subspaces to manage the groups and their membership.
   However, it is not possible to receive (or observe) membership events to spaces (i.e. rooms) via the Matrix Widget API if a user is not a member itself.
   Thus, this idea was discarded.

2. **Store memberships in dedicated events**:
   Instead of having a `members` property in the groups, we could create dedicated `net.nordeck.poll.group.member` events that refer to the joined group.
   This would've benefited the conflict resolution if multiple users edit groups at the same time.
   It would also be beneficial in a federated scenario.
   This was discarded due to the larger complexity.

3. **Store memberships with history**:
   In addition to **2.**, each membership event includes not just the current group membership, but instead a history of all past group memberships.
   This was discarded due to the larger complexity.

4. **Store all groups in a single event**:
   Instead of having multiple group events, one could store all events in a single `net.nordeck.poll.groups` event.
   This was discarded because it would've grown too large.
   Instead the selected implementation is a comprimise between **2.** and **4.**

5. **Add the current group membership to the voting event**:
   In order to correctly record the group membership in the time of voting, one could use the aforementioned group events only for management.
   The group could then be added to the vote event so when a group changes, it would not change the affiliation of past votes automatically.
   However, if a referenced group is deleted, the data would be inconsistent.
   In addition, invalid votes (i.e. a user did not cast a vote) should also be mapped to a group and would need to fall back to the membership information.
   Thus, this wouldn't bring many benefits.

6. **Third-party storage**:
   We could store the group memberships in e.g. a service with a third-party API.
   This was discarded because we don't want to leave the Matrix protocol.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

We will do the following:

1. Define a new State Event `net.nordeck.poll.group`.
2. Create a new Redux Slice that stores the new events.
3. Add a Admin UI that allows to create new groups. This will be available as a new widget entrypoint `/admin`.
4. The group information are displayed in the results page. They are displayed in the graph as well as in the name list (if enabled for the poll).
   - ~~Members without a group will be added to a virtual “unknown” group.~~ Replaced by [ADR002](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md).
5. The group membership is part of the generated PDF if the room contains group memberships.

> ~~The results must take the `leaveDate` into account.~~ Replaced by [ADR002](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md).

### Remarks

Editing groups is an administrator feature.
We don't expect different users to edit the groups at the same time.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

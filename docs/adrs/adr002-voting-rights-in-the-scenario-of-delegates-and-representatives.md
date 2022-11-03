# ADR002: Voting rights in the scenario of delegates and representatives

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

[ADR001](./adr001-poll-group-membership.md) introduced group memberships for participants.
As an extension to that feature, each group only has a certain amount of voting rights that are distributed to their members.
Each member can take the role of a “delegate“ or a “representative“.
Delegates are permitted to vote by default; representatives have no voting right.
If a delegate is absent or biased, a moderator of a poll can move the corresponding voting right to a representative of the same group.
This representation is only valid for a single poll.
A representative can only represent a single delegate as no one should be able to submit multiple votes.
If no representative is assigned, the voting right expires.

We need a way to let the moderator (=the person who is allowed to create a poll):

1. assign the roles to the group members.
2. select if the voting right of a delegate expires because of absence or bias when preparing a poll (the reason for the expiration is not stored).
3. assign a representative to move a voting right to another person when preparing a poll.

If groups are available, the evaluation of the votes should only consider votes from users that have a voting right—others should be ignored.
The act of absence or representation is only visible in the PDF documentation.
This feature doesn't affect the evaluation logic if no group exists.

This change should also resolve the unreliabiliy issues of the `joinDate` and `leaveDate`.
Due to a lack of historical event access, it wasn't possible to guarantee the integrity of finished polls when a group event was changed.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

### Group Membership

We will extend the `net.nordeck.poll.group` event with the role information:

```diff
  type: 'net.nordeck.poll.group'
  state_key: '<unique-id>'
  room_id: '!my-room:…'
  content:
    abbreviation: 'Die Durchsichtige Partei'
    color: '#ffffff00'
    members:
      # the ID of the user.
      '@user:test.de':
        joinDate: '2022-01-01T00:00:00Z'
        leaveDate: '2022-12-01T00:00:00Z'
+       # the role of the member. can be one of 'delegate' and
+       # 'representative'. defaults to 'delegate' if missing.
+       memberRole: 'delegate'
  event_id: '$…'
  # …
```

We will extend the group configuration dialog to configure the roles.
It won't be possible to use the groups feature without roles (but the user can choose to only define delegates).

> The `joinDate` and `leaveDate` fields are no longer used (see [Vote Evaluation](#vote-evaluation)) and will be deleted.

### Vote Preparation

We will extend the poll creation and edit dialog with a form to redistribute voting rights.

> This is the expected rendering:
>
> #### Delegates
>
> | Green group |                               |
> | ----------- | :---------------------------: |
> | Müller, A   |          **present**          |
> | Peters, B   | **represented by Klassen, C** |
> | Meyer, D    |          **absent**           |
> |             |                               |
> | Blue group  |                               |
> | Dreher, L   |   **represented by Doe, J**   |
> | Boehm, K    |          **absent**           |
> | Zweig, G    |          **present**          |
>
> - All `delegates` are listed in the first column.
> - The second column hosts a dropdown with the (1) “present”, (2) all users of role “representative” that are not yet selected, (3) “absent”.

We will store a copy of the group information with the selected delegation configuration in the `net.nordeck.poll` state event:

```diff
  type: 'net.nordeck.poll'
  state_key: '<unique-id>'
  room_id: '!my-room:…'
  content:
    title: 'title'
    question: 'question'
    description: 'description'
    pollType: 'byName'
    answers:
      - { 'id': '1', 'label': 'Ja' }
      - { 'id': '2', 'label': 'Nein' }
      - { 'id': '3', 'label': 'Enthaltung' }
    resultType: 'visible'
    duration: 1
+   groups:
+     - id: <group-state-key>
+       eventId: <latest-group-event-id>
+       abbreviation: 'Die Durchsichtige Partei'
+       color: '#ffffff00'
+       votingRights:
+         '@user-1:test.de':
+           state: 'active'
+         '@user-2:test.de':
+           state: 'invalid'
+         '@user-3:test.de':
+           state: 'represented'
+           representedBy: '@user-4:test.de'
+           # there might be more fields in the future
+     - ...
  event_id: '$…'
  #…
```

The key is the name of the user that originally owned the `delegate` role.
The `state` field contains information about the state of the voting right:

- `active`: the user is a delegate and the vote should be considered.
- `invalid`: the user is a delegate, but the vote should not be considered.
- `represented`: the user is a delegate, but the votes of the listed `representedBy` user should be considered instead.

Additional fields like a “reason” might be added in the future.

We will allow the moderator to update the information as long as the poll has not yet started.
Afterwards, it can't be changed.
This is the same behavior that all the other fields in the event have.

> We copy data to ensure data integrity with the tradeoff of data duplication.
> We expect that meeting rooms will only have a limited lifetime with a reasonable amount of polls (max. 10-20).

### Vote Evaluation

We will update the vote evaluation (i.e. the results table and charts) to consider the new information.
When the poll event has a `groups` content, we will use the new logic:

- Only count votes from `active` voting rights or from users that are listed as `representedBy`.
- Skip all other vote events.
- Don't use the `m.room.power_levels` event in the evaluation. The presence of a voting event implies that the power was given at the time of voting.
- Use the information to calculate the “number of eligible voters“ and the calculation of the “invalid“ votes.
- Only show the list of “valid” votes. The act of “absence“ or “representation“ is not visible in the tables or charts. But it will be part of the PDF report.

We will add a new section to the PDF that will tell if an absence or delegation happened.
For now, we interpret the `invalid` status as “being absent” in the user interface.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

### `net.nordeck.poll.group` Event

We will apply the changes to the event in [ADR001](./adr001-poll-group-membership.md) to keep an up-to-date reference.
This happens in a non-destructive way.

We also make the necessary updates to the admin UI.
We won't use the `joinDate` or `leaveDate` anymore because they are only unreliable indicators of group membership.
With the copied groups in each poll event, we can safely remove it.

### `net.nordeck.poll` Event

We will make the necessary updates in the poll creation dialog and the event structure.
The new `groups` field is optional and won't exist if the room didn't include any group.

There is the risk that the groups get updated while a poll was in the preparation phase (`poll created and delegation fixed -> member role changes in a group -> poll started`).
This can break the poll integrity.
To anticipate this problem, we include the `event_id` of the group in the event.
This allows us to compare those to the real events and notify the user if there are deviations.

The [starting dialog](#start-the-poll) emits a warning if such an inconsistency is detected so that the edit form can resolve the conflicts and ask the user to redo the configuration.

We resolve certain conflicts automatically when the user opens the edit dialog:

1. A group is added:

   ```yaml
   # situation
   groups:
     - id: group-1
       eventId: $AA
       # ...

   # resolution
   groups:
     - id: group-1
       eventId: $AA
       # ...
       # the new group is created and all users are active
     - id: group-2
       eventId: $BB
       # ...
   ```

2. A group is deleted:

   ```yaml
   # situation
   groups:
     - id: group-1
       eventId: $AA
       # ...
     - id: group-2
       eventId: $BB
       # ...


   # resolution
   groups:
     - id: group-1
       eventId: $AA
       # ...
     # the group is deleted
   ```

3. A user is deleted from a group:

   ```yaml
   # situation
   groups:
     - id: group-1
       eventId: $AA
       # ...
       votingRights:
         '@user-1:test.de':
           state: 'active'
         '@user-2:test.de':
           state: 'active'

   # resolution
   groups:
     - id: group-1
       eventId: $BB
       # ...
       votingRights:
         '@user-1:test.de':
           state: 'active'
         # the user is deleted
   ```

4. The role of a representing user changed to “delegate”:

   ```yaml
   # situation
   groups:
     - id: group-1
       eventId: $AA
       # ...
       votingRights:
         '@user-1:test.de':
           state: 'represents'
           representedBy: '@user-2:test.de'

   # resolution
   groups:
     - id: group-1
       eventId: $BB
       # ...
       votingRights:
         '@user-1:test.de':
           # changed to 'invalid'
           state: 'invalid'
         '@user-2:test.de':
           state: 'active'
   ```

5. A representing user left the group:

   ```yaml
   # situation
   groups:
     - id: group-1
       eventId: $AA
       # ...
       votingRights:
         '@user-1:test.de':
           state: 'represents'
           representedBy: '@user-2:test.de'

   # resolution
   groups:
     - id: group-1
       eventId: $BB
       # ...
       votingRights:
         '@user-1:test.de':
           # changed to 'invalid'
           state: 'invalid'
   ```

#### Inconsistencies in the `net.nordeck.poll` Event

The edit field makes sure that the poll event is consistent.
However, due to the nature of the Matrix protocol, we sanitize the events before we use the results for the poll evaluation.

There are multiple fields that are prone to inconsistencies.
These will not be created by the widget itself, but might be created by a malicious user or a protocol error:

1. A user that already has an original voting right is representing someone else:

   ```yaml
   # situation
   votingRights:
     '@user-1:test.de':
       state: 'active' # or 'invalid'
     '@user-2:test.de':
       state: 'represented'
       # ⚠️ the user already has a voting right!
       representedBy: '@user-1:test.de'

   # resolution
   votingRights:
     '@user-1:test.de':
       state: 'active'
     '@user-2:test.de':
       # interpreted as 'invalid'
       state: 'invalid'
   ```

2. A user represents multiple users:

   ```yaml
   # situation
   votingRights:
     '@user-1:test.de':
       state: 'represented'
       representedBy: '@user-3:test.de'
     '@user-2:test.de':
       state: 'represented'
       # ⚠️ the user already is a representative!
       representedBy: '@user-3:test.de'

   # resolution
   votingRights:
     '@user-1:test.de':
       state: 'represented'
       # the first event in the object will be used
       representedBy: '@user-3:test.de'
     '@user-2:test.de':
       # interpreted as 'invalid'
       state: 'invalid'
   ```

3. A user represents persons in different groups:

   ```yaml
   # situation
   groups:
     - id: group-1
       # ...
       votingRights:
         '@user-1:test.de':
            state: 'represented'
            # ⚠️ the user already is a representative; but in another group!
            representedBy: '@user-3:test.de'
     - id: group-2
       # ...
       votingRights:
         '@user-2:test.de':
            state: 'represented'
            # ⚠️ the user already is a representative; but in another group!
            representedBy: '@user-3:test.de'

   # resolution
   groups:
     - id: group-1
       # ...
       votingRights:
         '@user-1:test.de':
            state: 'represented'
            # the first event in the object will be used
            representedBy: '@user-3:test.de'
     - id: group-2
       # ...
       votingRights:
         '@user-2:test.de':
            # interpreted as 'invalid'
            state: 'invalid'
   ```

4. A user is part of multiple groups at once:

   ```yaml
   # situation
   groups:
     - id: group-1
       # ...
       votingRights:
         '@user-1:test.de':
           # ⚠️ the user already is a delegate in another group!
           state: 'delegate'
     - id: group-2
       # ...
       votingRights:
         '@user-1:test.de':
           # ⚠️ the user already is a delegate in another group!
           state: 'delegate'

   # resolution
   groups:
     - id: group-1
       # ...
       votingRights:
         '@user-1:test.de':
         # the first event in the object will be used
           state: 'delegate'
     - id: group-2
       # ...
       votingRights:
         # the user is removed from the group
   ```

> We must trust that a user that is selected as a representative originally had the “representative” role and that the user is in the same group as the “delegate”.
> There is no way to validate this case with only the information in the `net.nordeck.poll` event.

### Start the Poll

It isn't possible to stop a running poll right now, so as a UX improvement, we show the user a summary of the delegation process prior to starting the poll.
We will add a confirmation dialog to the start action that gives the user the option to abort the start if something is wrong.
This dialog also shows a warning if an inconsistency between the poll configuration and the group events is detected (see also [`net.nordeck.poll` Event](#netnordeckpoll-event)).
The information can then be updated in the edit dialog.

> In the future, the dialog might also include a warning if a user with a voting right hasn't joined the room yet.

### Evaluate the Poll

[ADR001](./adr001-poll-group-membership.md) introduces an “unknown” group for all votes from members that are not assigned to a group.
Since these users have no voting right anymore, this group is obsolete and won't be displayed anymore.

### `m.room.power_levels` Event

Prior to this change, the voting right was defined by the `m.room.power_levels` event.
While we still need to take it into account in the poll form, this information is ignored in the evaluation of the poll.
However, we still want to ensure a certain level of compliance to stop non-voters from sending any vote events to the room.
Therefore, we propose the following:

1. All members with the role `delegate` and `representative` have the power level to send the `net.nordeck.poll.vote` event.
2. The UI will block voting for `representatives` that are not assigned.
3. The UI will ignore any votes from invalid voters.
4. An out-of-scope process can do a validation check and emit alerts if invalid vote events are detected in a room to invalidate a poll if needed.

With this decision, the home server will accept vote events by non-assigned `representatives`, however, we accept this risk.
A proper change (i.e. updating the `m.room.power_levels` event for each poll) is too complicated and too error prone especially regarding parallel polls with different delegation settings.

### No Groups Mode

If no groups are present in the event, the voting evaluation falls back to the following rules:

1. All votes for a poll (during the poll duration) are considered, regardless of the current power of the user. If there is a vote event, the user had the power level in the past.
2. Invalid votes are only considered for persons that have the power to vote at the present date.

This results in some edge cases that we can't properly handle if no groups are present:

1. A user had required voting power during the poll, didn't vote, and lost it afterwards -> He won't be listed in the results view.
2. A user didn't have the required voting power during the poll and got the power afterwards -> He will be listed in the results view with an invalid vote.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

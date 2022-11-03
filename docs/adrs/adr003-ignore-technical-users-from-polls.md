# ADR003: Ignore Technical Users from Polls

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

The Poll widget is often used in environments where the rooms are setup by an automation solution (for example “Meetings widget”).
These automations are driven by bot users that have at least the moderation role (power level ≥ 50) in the room.
This property qualifies this bot user to be a voter and thus can skew the results with “invalid” votes (considering bots don't actually vote).
This only affects non-group polls (see also [ADR002][adr002]) because we assume that no-one would add a bot to a group.

We want to ignore bot users in all result views (tables, graphs, PDF).

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will add a `REACT_APP_IGNORE_USER_IDS` environment variable that includes a list of user IDs that should be ignored by the poll widget.
We will use `,` as delimiter for multiple user ids since it is no valid character for user identifiers (see [User Identifiers][user-identifiers] and [Server Name][server-name]).

> #### Example:
>
> ```yaml
> REACT_APP_IGNORE_USER_IDS: '@bot1:matrix.org,@bot2:matrix.org'
> ```

### Alternative 1: User Name Guidelines

New Vector suggested that bots should prefer to use a username that starts with a `_` (example: `@_bot:matrix.org`).
However, the specification requires that `[i]dentifiers must start with one of the characters [a-z], [...]` ([Common Namespaced Identifier Grammar][common-namespaced-identifier-grammar]).
Thus, it is not possible to create those users via the original Synapse API.
Only very few of the observed bots use this pattern, so it is not stable enough to rely on it.
We also don't know if future user cases might require bots to be actually able to vote.

### Alternative 2: User-configured ignore-list

We could store a list of ignored user ids in the `net.nordeck.poll.settings` event so an administrator could add additional bots if needed.
This would also require a UI.
The meetings bot could add itself to this list on meeting creation.
This was discarded because we don't want to create a further dependency between the different widgets.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

Using environment variables means that the deployment configuration of the poll widget server container specifies which bot is ignored.
Thus the widget users/administrator will not be able to ignore additional users.

Having environment configurations skew the results of the poll widget might add problems because it affects all future and past poll rooms which might break their integrity.

### Implementation

We will ignore all `m.room.member` events if the `state_key` is part of `REACT_APP_IGNORE_USER_IDS`.
All features that rely on the cached room list will thus don't consider the user:

1. The number of “voters” when no groups exist.
2. The calculation of “invalid” votes when no groups exist.
3. The PDF report for polls without groups.
4. The group member selection dialog.

> It was not intended to stop being able to add ignored users to groups, however, it is easier to ignore the user globally instead of only selectively.
> Thus, the user is also ignored in that view, i.e., it won't be possible to add a bot to a group anymore.

There are some limitations:

- If an ignored user did vote, the vote will still be displayed (according to [ADR002 (No Groups Mode)](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md#no-groups-mode)).
- If the bot is displayed anywhere in the UI, only the user-id will be displayed since the display name is not part of the redux state.
  This is the same behavior as for `kick`ed, `ban`ed, or `leave`d users.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

[adr002]: ./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md
[common-namespaced-identifier-grammar]: https://spec.matrix.org/v1.2/appendices/#common-namespaced-identifier-grammar
[user-identifiers]: https://spec.matrix.org/v1.2/appendices/#user-identifiers
[server-name]: https://spec.matrix.org/v1.2/appendices/#server-name

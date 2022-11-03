# ADR004: Polls without duration

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

All polls are created with a fixed duration in minutes so the votes are only valid if they are cast between `[startTime..startTime+duration)`.
There are new use cases where the owner of a poll wants to (1) end a poll early because everyone already voted, (2) extend the duration while the poll runs to give everyone more time, (3) start a poll without a duration and manually stop it.
It should also be possible to switch between modes, for example creating a poll without duration, but specifing a duration afterwards.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will add a new `endTime` field to the poll event that is only present when the poll was started (analog to the `startTime` field):

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
    startTime: '2022-01-01T15:20:23Z'
+   endTime: '2022-01-01T15:21:23Z'
  event_id: '$…'
  #…
```

We will use the `duration` field as a template for the `endTime` when a poll is started, but will only use `startTime` and `endTime` when evaluating the votes of the poll (see also [ADR002](./adr002-voting-rights-in-the-scenario-of-delegates-and-representatives.md)).
Polls should be considered running if the current time before the `endTime`.
We will use an `endTime` of `null` for a started poll that has no defined duration but needs to be stopped manually.
We will also support the `duration: undefined` case to show that a poll should not end automatically.

### Examples

We will support the following modes:

#### Poll with a duration (-> existing use case)

```ts
const createdPoll = {
  // ...
  duration: 1,
};

const startedPoll = {
  // ...
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  endTime: '2022-01-01T15:21:23Z',
};
```

#### Poll without a duration

```ts
const createdPoll = {
  // ...
  duration: undefined,
};

const startedPoll = {
  // ...
  duration: undefined,
  startTime: '2022-01-01T15:20:23Z',
  // there is a difference between null and undefined because
  // undefined is the backward compatible case before the
  // endTime field was introduced.
  endTime: null,
};
```

#### Update the duration of a running poll

```ts
const startedPoll = {
  // ...
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  endTime: '2022-01-01T15:21:23Z',
};

const startedPoll = {
  // ...
  // don't update the original duration since it is just a template
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  // move the end time accordingly. This could also changed to
  // "now" to end the vote immediately. Can also be changed to
  // null to remove the timer.
  endTime: '2022-01-01T15:22:23Z',
};
```

#### Immediately stop a running poll with a duration

```ts
const startedPoll = {
  // ...
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  endTime: '2022-01-01T15:21:23Z',
};

const startedPoll = {
  // ...
  // don't update the original duration since it is just a template
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  // set the endtime to "now"
  endTime: '<now-time>',
};
```

#### Stop a poll without duration

```ts
const startedPoll = {
  // ...
  duration: undefined,
  startTime: '2022-01-01T15:20:23Z',
  endTime: null,
};

const startedPoll = {
  // ...
  // don't update the original duration since it is just a template
  duration: undefined,
  startTime: '2022-01-01T15:20:23Z',
  // this can be "now" to stop it immediately
  // or a future date to start the timer.
  endTime: '2022-01-01T15:22:23Z',
};
```

### Alternatives

Don't add a new `endTime` field but update the existing `duration` field.
But since the `duration` is given in minutes, the resolution would not be enough if a poll should for example be cancelled after 50 seconds.
It could be an option to use `double` values, but we think a dedicated `endTime` would be more stable.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

We want to be backward-compatible so we can still read all the poll events that are in the old format.
We can achieve this by updating the poll events when we read them from the room:

```ts
const originalEvent = {
  // ...
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  // missing endTime (-> it is not null but actually missing in the object)
};

const migratedEvent = {
  // ...
  duration: 1,
  startTime: '2022-01-01T15:20:23Z',
  endTime: '2022-01-01T15:20:23Z',
};

// don't write it back to the room but only keep
// the migrated representation in memory
```

We also want to make sure that we don't use the `duration` field anymore in the evaluation of the results.
It should only be used in the process of starting a poll to generate the original `endTime`.

> We might still need to use it in the “start preview” where we want to display the timer.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

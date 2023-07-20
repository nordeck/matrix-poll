/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getNonce } from '@matrix-widget-toolkit/mui';
import { Box } from '@mui/material';
import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  Droppable,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';

export function sortItems<T>(
  items: T[],
  sourceIndex: number,
  targetIndex: number,
): T[] {
  const sortedItems = [...items];
  const [reorderedItem] = sortedItems.splice(sourceIndex, 1);
  sortedItems.splice(targetIndex, 0, reorderedItem);
  return sortedItems;
}

type DraggableListProps<T> = {
  children: (items: T[]) => ReactNode;
  disabled?: boolean;
  onDrop: (sortedItems: T[], sourceIndex: number, targetIndex: number) => void;
  items: T[];
};

/**
 * A component that renders a draggable list where the user can reorder the items.
 *
 * @param param0 - {@link DraggableListProps}
 */
export function DraggableList<T>({
  children,
  disabled = false,
  onDrop,
  items: originalItems,
}: DraggableListProps<T>): ReactElement {
  const { t } = useTranslation();
  const [items, setItems] = useState<T[]>(originalItems);

  useEffect(() => {
    setItems(originalItems);
  }, [originalItems]);

  const handleDragStart = useCallback(
    (initial: DragStart, { announce }: ResponderProvided) => {
      announce(
        t(
          'draggableList.dragStart',
          'You have lifted a poll. It is in position {{startPosition}} of {{totalCount}} in the list. Use the arrow keys to move, space bar to drop, and escape to cancel.',
          {
            startPosition: initial.source.index + 1,
            totalCount: items.length,
          },
        ),
      );
    },
    [items.length, t],
  );

  const handleDragUpdate = useCallback(
    (update: DragUpdate, { announce }: ResponderProvided) => {
      if (!update.destination) {
        announce(
          t(
            'draggableList.notOverDropTarget',
            'You are currently not dragging over any droppable area.',
          ),
        );
      } else {
        announce(
          t(
            'draggableList.movedPosition',
            `You have moved the poll to position {{position}} of {{totalCount}}.`,
            {
              position: update.destination.index + 1,
              totalCount: items.length,
            },
          ),
        );
      }
    },
    [items.length, t],
  );

  const handleDragEnd = useCallback(
    (result: DropResult, { announce }: ResponderProvided) => {
      if (result.reason === 'CANCEL') {
        announce(
          t(
            'draggableList.movementCanceled',
            'Movement cancelled. The poll has returned to its starting position of {{startPosition}}.',
            {
              startPosition: result.source.index + 1,
            },
          ),
        );
        return;
      }

      if (!result.destination) {
        announce(
          t(
            'draggableList.droppedOnNoDropTarget',
            'The poll has been dropped while not over a location. The poll has returned to its starting position of {{startPosition}}.',
            { startPosition: result.source.index + 1 },
          ),
        );
        return;
      }

      announce(
        t(
          'draggableList.dropped',
          'You have dropped the poll. It has moved from position {{startPosition}} to {{destinationPosition}}.',
          {
            startPosition: result.source.index + 1,
            destinationPosition: result.destination.index + 1,
          },
        ),
      );

      if (result.destination.index === result.source.index) {
        return;
      }

      const sourceIndex = result.source.index;
      const targetIndex = result.destination.index;

      setItems((items) => {
        const sortedItems = sortItems(items, sourceIndex, targetIndex);
        onDrop(sortedItems, sourceIndex, targetIndex);
        return sortedItems;
      });
    },
    [onDrop, t],
  );

  return (
    <DragDropContext
      // Required as we don't have unsafe-inline enabled
      nonce={getNonce()}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
    >
      <Droppable droppableId="list" isDropDisabled={disabled}>
        {(provided) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              '& [data-rbd-placeholder-context-id]': {
                listStyleType: 'none',
              },
            }}
          >
            {children(items)}

            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}

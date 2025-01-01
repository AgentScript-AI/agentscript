import type { Annotation, StateDefinition, StateType, UpdateType } from '@langchain/langgraph';

import type { ServiceContext } from '@nzyme/ioc';
import { defineService } from '@nzyme/ioc';

export type AnnotationRoot<S extends StateDefinition> = ReturnType<typeof Annotation.Root<S>>;

export type GraphNode<S extends StateDefinition> = (state: StateType<S>) => Promise<UpdateType<S>>;

export interface GraphNodeDefinition<S extends StateDefinition> {
    name: string;
    state: AnnotationRoot<S>;
    setup: (ctx: ServiceContext) => GraphNode<S>;
}

export function defineGraphNode<S extends StateDefinition>(definition: GraphNodeDefinition<S>) {
    return defineService({
        name: definition.name,
        setup: definition.setup,
    });
}

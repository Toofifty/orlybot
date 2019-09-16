export interface User {
    id: string
}

export interface Dict<T> {
    [key: string]: T
}

export type KeyPredicate<T> = (key: string, element: T) => boolean
export type ElementPredicate<T> = (element: T, index: number) => boolean

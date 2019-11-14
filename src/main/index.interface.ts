export interface Config {
    base: {
        name: string,
        path: string
    },
    other: { name: string, path: string}[]
}

export interface Dir<T = string> {
    [key: string]: T
  }
export type UseCaseErrorKind = 'invalid' | 'conflict' | 'not-found'

/** Falha esperada de um caso de uso, com mensagem que pode ser mostrada ao usuário. */
export class UseCaseError extends Error {
  readonly kind: UseCaseErrorKind

  constructor(kind: UseCaseErrorKind, message: string) {
    super(message)
    this.name = 'UseCaseError'
    this.kind = kind
  }
}

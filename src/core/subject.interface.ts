/** Represents a subject that can be observed */
export interface Subject {
  /** Gets the key that identifies this subject */
  get key(): symbol;
}

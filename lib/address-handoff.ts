/**
 * Hands a freshly saved address back to checkout. Checkout opens the address wizard on the Addresses screen, and when the
 * customer saves, checkout picks that address up instead of falling back to their default one.
 */
let created: string | undefined;

export const addressHandoff = {
  set(id?: string) { created = id; },
  /** Returns the address saved since checkout last looked, once. */
  take() {
    const id = created;
    created = undefined;
    return id;
  },
};

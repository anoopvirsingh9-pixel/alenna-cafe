import type { CartModifier } from "@/db/schema";

export type CartLine = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: CartModifier[];
  notes?: string;
  image?: string;
};

export function lineTotal(line: CartLine) {
  return line.price * line.quantity;
}

export function cartSubtotal(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function sameLine(a: CartLine, b: Pick<CartLine, "menuItemId" | "modifiers" | "notes">) {
  return (
    a.menuItemId === b.menuItemId &&
    a.notes === b.notes &&
    JSON.stringify(a.modifiers) === JSON.stringify(b.modifiers)
  );
}

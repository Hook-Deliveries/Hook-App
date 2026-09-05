import { CartScreen } from "@/components/cart/CartScreen";

/** Cart tab — reached from the tab bar, so there is nothing to go back to. */
export default function CartTabScreen() {
  return <CartScreen showBackButton={false} />;
}

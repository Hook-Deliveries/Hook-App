import { CartScreen } from "@/components/cart/CartScreen";

/** The Cart tab: opens in place like Discover, Offers and Profile. Other flows push the standalone cart route instead. */
export default function CartTabScreen() {
  return <CartScreen inTab />;
}

import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productFind = cart.find(product => product.id === productId);

      if (productFind) {
       
        await updateProductAmount({
          amount: (productFind.amount + 1),
          productId
        });

        return;
      }

      const response = await api.get<Product>(`products/${productId}`);
      const product = response.data;
      product.amount = 1;

      setCart([...cart, product]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      if (!cart.find(product => product.id === productId)) {
        toast.error('Erro na remoção do produto');
        return;
      }
      
      const newCart = cart.filter(product => product.id !== productId);

      setCart([...newCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const response = await api.get<Stock>(`stock/${productId}`);
      const productStock = response.data;

      if (productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productCart = cart.find(c => c.id === productId) as Product;

      productCart.amount = amount;

      setCart([...cart.filter(c => c.id !== productId), productCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart.filter(c => c.id !== productId), productCart]));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

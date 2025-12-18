"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Loader2,
  ChevronRight,
  Search,
  DollarSign,
} from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/utils";
import { ProductType } from "@/hooks/useProductRegistry";
import { Input, Badge, Skeleton } from "@/components/ui";

interface Product {
  id: bigint;
  name: string;
  description: string;
  productType: ProductType;
  publicPrice: bigint;
  active: boolean;
}

interface ProductSelectorProps {
  merchantAddress: `0x${string}`;
  productType?: ProductType;
  selectedProductId: bigint | null;
  onSelect: (product: Product | null) => void;
  disabled?: boolean;
}

const productTypeLabels: Record<ProductType, string> = {
  [ProductType.PRODUCT]: "Product",
  [ProductType.SUBSCRIPTION]: "Subscription",
  [ProductType.DONATION]: "Donation",
  [ProductType.P2P]: "P2P",
};

export function ProductSelector({
  merchantAddress,
  productType,
  selectedProductId,
  onSelect,
  disabled = false,
}: ProductSelectorProps) {
  const publicClient = usePublicClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch products from merchant
  useEffect(() => {
    const fetchProducts = async () => {
      if (
        !publicClient ||
        !merchantAddress ||
        merchantAddress === "0x0000000000000000000000000000000000000000"
      ) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get product count
        const count = await publicClient.readContract({
          address: CONTRACTS.PRODUCT_REGISTRY,
          abi: [
            {
              name: "productCounts",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "merchant", type: "address" }],
              outputs: [{ name: "", type: "uint256" }],
            },
          ],
          functionName: "productCounts",
          args: [merchantAddress],
        });

        const fetchedProducts: Product[] = [];
        const productCountNum = Number(count);

        for (let i = 0; i < productCountNum; i++) {
          const product = (await publicClient.readContract({
            address: CONTRACTS.PRODUCT_REGISTRY,
            abi: [
              {
                name: "products",
                type: "function",
                stateMutability: "view",
                inputs: [
                  { name: "merchant", type: "address" },
                  { name: "productId", type: "uint256" },
                ],
                outputs: [
                  { name: "merchant", type: "address" },
                  { name: "name", type: "string" },
                  { name: "description", type: "string" },
                  { name: "productType", type: "uint8" },
                  { name: "pricingMode", type: "uint8" },
                  { name: "publicPrice", type: "uint256" },
                  { name: "encryptedPrice", type: "bytes32" },
                  { name: "active", type: "bool" },
                  { name: "createdAt", type: "uint256" },
                ],
              },
            ],
            functionName: "products",
            args: [merchantAddress, BigInt(i)],
          })) as any;

          // Only include active products
          if (product[7]) {
            fetchedProducts.push({
              id: BigInt(i),
              name: product[1],
              description: product[2],
              productType: product[3] as ProductType,
              publicPrice: product[5],
              active: product[7],
            });
          }
        }

        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [publicClient, merchantAddress]);

  // Filter products by type and search
  const filteredProducts = products.filter((product) => {
    // Filter by product type if specified
    if (
      productType !== undefined &&
      productType !== ProductType.P2P &&
      product.productType !== productType
    ) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 bg-dark-50 dark:bg-dark-900 border-2 border-dashed border-dark-200 dark:border-dark-700">
        <Package className="w-12 h-12 mx-auto mb-3 text-dark-400" />
        <p className="font-pixel text-[10px] uppercase tracking-wider text-dark-500 mb-1">
          No Products Available
        </p>
        <p className="text-xs text-dark-400">
          This merchant hasn&apos;t listed any products yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {products.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
            disabled={disabled}
          />
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductId === product.id;
            return (
              <motion.button
                key={product.id.toString()}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => onSelect(isSelected ? null : product)}
                disabled={disabled}
                className={`
                  w-full p-4 border-2 text-left transition-all
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    isSelected
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                      : "border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-pink-300 dark:hover:border-pink-700"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-pixel text-[10px] uppercase tracking-wider truncate">
                        {product.name}
                      </h4>
                      <Badge
                        variant="info"
                        className="text-[8px] flex-shrink-0"
                      >
                        {productTypeLabels[product.productType]}
                      </Badge>
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-2">
                      {product.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-pink-500" />
                        <span className="font-mono text-sm font-bold">
                          {formatTokenAmount(product.publicPrice, 6, "")}
                        </span>
                      </div>
                      <span className="text-[10px] text-dark-400">USDC</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-6 text-dark-400">
            <p className="text-sm">No products match your search</p>
          </div>
        )}
      </div>

      {/* Selected Product Summary */}
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-pixel text-[10px] uppercase tracking-wider text-pink-700 dark:text-pink-300">
                Selected Product
              </p>
              <p className="font-sans text-sm font-medium">
                {selectedProduct.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-pink-600 dark:text-pink-400">
                {formatTokenAmount(selectedProduct.publicPrice, 6, "USDC")}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export type { Product };

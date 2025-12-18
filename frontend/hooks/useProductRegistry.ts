import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { CONTRACTS, PRODUCT_REGISTRY_ABI } from "@/lib/contracts";
import { useState } from "react";

export enum ProductType {
  PRODUCT = 0,
  SUBSCRIPTION = 1,
  DONATION = 2,
  P2P = 3,
}

export enum PricingMode {
  PUBLIC = 0,
  ENCRYPTED = 1,
}

export interface Product {
  name: string;
  description: string;
  productType: ProductType;
  pricingMode: PricingMode;
  publicPrice: bigint;
  active: boolean;
}

export function useProductRegistry() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  // Register a product with public pricing
  const registerProduct = async (
    name: string,
    description: string,
    productType: ProductType,
    price: bigint
  ) => {
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRODUCT_REGISTRY,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: "registerProduct",
        args: [name, description, productType, price],
      });
      return hash;
    } finally {
      setIsLoading(false);
    }
  };
  // Batch register multiple products (saves gas!)
  const registerProductsBatch = async (
    products: Array<{
      name: string;
      description: string;
      productType: ProductType;
      price: bigint;
    }>
  ) => {
    setIsLoading(true);
    try {
      const names = products.map(p => p.name);
      const descriptions = products.map(p => p.description);
      const productTypes = products.map(p => p.productType);
      const prices = products.map(p => p.price);
      
      const hash = await writeContractAsync({
        address: CONTRACTS.PRODUCT_REGISTRY,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: "registerProductsBatch",
        args: [names, descriptions, productTypes, prices],
      });
      return hash;
    } finally {
      setIsLoading(false);
    }
  };
  // Get product details
  const getProduct = (merchant: `0x${string}`, productId: bigint) => {
    return useReadContract({
      address: CONTRACTS.PRODUCT_REGISTRY,
      abi: PRODUCT_REGISTRY_ABI,
      functionName: "getProduct",
      args: [merchant, productId],
    });
  };

  // Get product count for merchant
  const getProductCount = (merchant: `0x${string}`) => {
    return useReadContract({
      address: CONTRACTS.PRODUCT_REGISTRY,
      abi: PRODUCT_REGISTRY_ABI,
      functionName: "productCounts",
      args: [merchant],
    });
  };

  // Update product details
  const updateProduct = async (
    productId: bigint,
    name: string,
    description: string,
    active: boolean
  ) => {
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRODUCT_REGISTRY,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: "updateProduct",
        args: [productId, name, description, active],
      });
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  // Update product price (public pricing)
  const updatePrice = async (productId: bigint, newPrice: bigint) => {
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRODUCT_REGISTRY,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: "updatePrice",
        args: [productId, newPrice],
      });
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivate product
  const deactivateProduct = async (productId: bigint) => {
    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRODUCT_REGISTRY,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: "deactivateProduct",
        args: [productId],
      });
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    registerProduct,
    registerProductsBatch,
    getProduct,
    getProductCount,
    updateProduct,
    updatePrice,
    deactivateProduct,
    isLoading,
    address,
  };
}

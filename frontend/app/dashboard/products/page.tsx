"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Home,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Textarea,
  Badge,
  Modal,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import {
  useProductRegistry,
  ProductType,
} from "@/hooks/useProductRegistry";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { CONTRACTS } from "@/lib/contracts";
import { formatTokenAmount, parseAmount } from "@/lib/utils";

interface Product {
  id: bigint;
  name: string;
  description: string;
  productType: ProductType;
  publicPrice: bigint;
  active: boolean;
}

const productTypeLabels: Record<ProductType, string> = {
  [ProductType.PRODUCT]: "Product",
  [ProductType.SUBSCRIPTION]: "Subscription",
  [ProductType.DONATION]: "Donation",
  [ProductType.P2P]: "P2P",
};

const productTypeColors: Record<ProductType, string> = {
  [ProductType.PRODUCT]: "info",
  [ProductType.SUBSCRIPTION]: "warning",
  [ProductType.DONATION]: "success",
  [ProductType.P2P]: "secondary",
};

export default function ProductsPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { isMerchant } = usePaymentGateway();
  const {
    registerProduct,
    registerProductsBatch,
    updateProduct,
    updatePrice,
    deactivateProduct,
    isLoading: registryLoading,
  } = useProductRegistry();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [processingId, setProcessingId] = useState<bigint | null>(null);

  // Batch creation state
  const [batchProducts, setBatchProducts] = useState<Array<{
    name: string;
    description: string;
    productType: ProductType;
    price: string;
  }>>([
    { name: "", description: "", productType: ProductType.PRODUCT, price: "" },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productType: ProductType.PRODUCT,
    price: "",
  });

  // Search filter (case-insensitive)
  const [searchFilter, setSearchFilter] = useState("");

  // Get product count for merchant
  const { data: productCount, refetch: refetchCount } = useReadContract({
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
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fetch all products for merchant
  const fetchProducts = async () => {
    if (!address || !publicClient || !productCount) {
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    const count = Number(productCount);
    const fetchedProducts: Product[] = [];

    try {
      for (let i = 0; i < count; i++) {
        const product = await publicClient.readContract({
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
          args: [address, BigInt(i)],
        }) as any;

        fetchedProducts.push({
          id: BigInt(i),
          name: product[1],
          description: product[2],
          productType: product[3] as ProductType,
          publicPrice: product[5],
          active: product[7],
        });
      }
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (productCount !== undefined) {
      fetchProducts();
    }
  }, [productCount, address]);

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    const price = parseAmount(formData.price, 6); // 6 decimals for USDC

    try {
      const hash = await registerProduct(
        formData.name,
        formData.description,
        formData.productType,
        price
      );

      if (hash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        toast.success("Product created successfully!");
        setShowCreateModal(false);
        resetForm();
        await refetchCount();
        await fetchProducts();
      }
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Failed to create product");
    }
  };

  const handleBatchCreate = async () => {
    const validProducts = batchProducts.filter(p => p.name && p.price);
    
    if (validProducts.length === 0) {
      toast.error("Add at least one product with name and price");
      return;
    }

    try {
      const productsToRegister = validProducts.map(p => ({
        name: p.name,
        description: p.description,
        productType: p.productType,
        price: parseAmount(p.price, 6),
      }));

      const hash = await registerProductsBatch(productsToRegister);

      if (hash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        toast.success(`${validProducts.length} products created in one transaction!`);
        setShowBatchModal(false);
        setBatchProducts([{ name: "", description: "", productType: ProductType.PRODUCT, price: "" }]);
        await refetchCount();
        await fetchProducts();
      }
    } catch (error) {
      console.error("Batch create error:", error);
      toast.error("Failed to create products");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      // Update product details
      const hash = await updateProduct(
        editingProduct.id,
        formData.name,
        formData.description,
        editingProduct.active
      );

      if (hash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });

        // Update price if changed
        const newPrice = parseAmount(formData.price, 6);
        if (newPrice !== editingProduct.publicPrice) {
          const priceHash = await updatePrice(editingProduct.id, newPrice);
          if (priceHash) {
            await publicClient.waitForTransactionReceipt({ hash: priceHash });
          }
        }

        toast.success("Product updated successfully!");
        setEditingProduct(null);
        resetForm();
        await fetchProducts();
      }
    } catch (error) {
      console.error("Update product error:", error);
      toast.error("Failed to update product");
    }
  };

  const handleToggleActive = async (product: Product) => {
    setProcessingId(product.id);
    try {
      if (product.active) {
        const hash = await deactivateProduct(product.id);
        if (hash && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
          toast.success("Product deactivated");
        }
      } else {
        const hash = await updateProduct(
          product.id,
          product.name,
          product.description,
          true
        );
        if (hash && publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
          toast.success("Product activated");
        }
      }
      await fetchProducts();
    } catch (error) {
      console.error("Toggle active error:", error);
      toast.error("Failed to update product status");
    } finally {
      setProcessingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      productType: ProductType.PRODUCT,
      price: "",
    });
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      productType: product.productType,
      price: formatTokenAmount(product.publicPrice, 6, ""),
    });
    setEditingProduct(product);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center py-16">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-6 text-pink-500" />
              <h2 className="font-pixel text-lg uppercase tracking-wider mb-4">
                Connect Wallet
              </h2>
              <p className="font-sans text-dark-500 dark:text-dark-400 mb-6">
                Connect your wallet to manage products
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isMerchant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center py-16">
            <CardContent>
              <AlertCircle className="w-16 h-16 mx-auto mb-6 text-accent-500" />
              <h2 className="font-pixel text-lg uppercase tracking-wider mb-4">
                Merchant Required
              </h2>
              <p className="font-sans text-dark-500 dark:text-dark-400 mb-6">
                You need to be a registered merchant to manage products.
                <br />
                Please register first or contact the admin.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/register">
                  <Button variant="primary">Register as Merchant</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-dark-900 dark:to-dark-950 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="font-pixel text-xl md:text-2xl uppercase tracking-wider mb-2">
              <span className="glitch" data-text="Products">
                Products
              </span>
            </h1>
            <p className="font-sans text-dark-500 dark:text-dark-400">
              Manage your products and pricing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw
                className={`w-3 h-3 ${isLoadingProducts ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBatchModal(true)}
            >
              <Package className="w-4 h-4 mr-2" />
              Batch Create
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="w-3 h-3 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search Filter */}
          {products.length > 0 && (
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search products by name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-8 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Package className="w-12 h-12" />}
                title="No Products Yet"
                description="Create your first product to start accepting payments"
                action={
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Product
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {products
                  .filter((product) =>
                    product.name
                      .toLowerCase()
                      .includes(searchFilter.toLowerCase())
                  )
                  .map((product, index) => (
                  <motion.div
                    key={product.id.toString()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`h-full ${
                        !product.active ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-pixel text-sm uppercase tracking-wider truncate mb-1">
                              {product.name}
                            </h3>
                            <Badge
                              variant={
                                productTypeColors[product.productType] as any
                              }
                              className="text-[8px]"
                            >
                              {productTypeLabels[product.productType]}
                            </Badge>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              product.active ? "bg-green-500" : "bg-dark-300"
                            }`}
                            title={product.active ? "Active" : "Inactive"}
                          />
                        </div>

                        <p className="text-sm text-dark-500 dark:text-dark-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                          {product.description || "No description"}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-pink-500" />
                            <span className="font-mono text-lg font-bold">
                              {formatTokenAmount(product.publicPrice, 6, "")}
                            </span>
                            <span className="text-xs text-dark-500">USDC</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const code = `<button onclick="buyProduct(${product.id})">Buy ${product.name}</button>

<script src="https://aruvi.app/sdk.js"></script>
<script>
const aruvi = Aruvi.init({
  merchantAddress: '${address}',
  network: 'sepolia'
});

async function buyProduct(productId) {
  await aruvi.checkout({
    productId: productId,
    orderId: 'ORDER-' + Date.now()
  });
}
</script>`;
                              navigator.clipboard.writeText(code);
                              toast.success('Integration code copied!');
                            }}
                          >
                            📋 Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant={product.active ? "secondary" : "primary"}
                            size="sm"
                            onClick={() => handleToggleActive(product)}
                            isLoading={processingId === product.id}
                          >
                            {product.active ? (
                              <>
                                <PowerOff className="w-3 h-3 mr-1" />
                                Off
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3 mr-1" />
                                On
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showCreateModal || !!editingProduct}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProduct(null);
            resetForm();
          }}
          title={editingProduct ? "Edit Product" : "Create Product"}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            {!editingProduct && (
              <div>
                <Label>Product Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(productTypeLabels)
                    .filter(([key]) => Number(key) !== ProductType.P2P)
                    .map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            productType: Number(key) as ProductType,
                          })
                        }
                        className={`p-3 border-2 text-sm transition-all ${
                          formData.productType === Number(key)
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                            : "border-dark-200 dark:border-dark-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="price">Price (USDC) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                isLoading={registryLoading}
              >
                {editingProduct ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Batch Create Modal */}
        <Modal
          isOpen={showBatchModal}
          onClose={() => {
            setShowBatchModal(false);
            setBatchProducts([
              {
                name: "",
                description: "",
                productType: ProductType.PRODUCT,
                price: "",
              },
            ]);
          }}
          title="Batch Create Products"
          size="lg"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {batchProducts.map((product, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Product {index + 1}</h4>
                  {batchProducts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...batchProducts];
                        updated.splice(index, 1);
                        setBatchProducts(updated);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => {
                        const updated = [...batchProducts];
                        updated[index].name = e.target.value;
                        setBatchProducts(updated);
                      }}
                      placeholder="Product name"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={product.description}
                      onChange={(e) => {
                        const updated = [...batchProducts];
                        updated[index].description = e.target.value;
                        setBatchProducts(updated);
                      }}
                      placeholder="Product description"
                    />
                  </div>

                  <div>
                    <Label>Type</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {Object.entries(productTypeLabels)
                        .filter(([key]) => Number(key) !== ProductType.P2P)
                        .map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const updated = [...batchProducts];
                              updated[index].productType = Number(
                                key
                              ) as ProductType;
                              setBatchProducts(updated);
                            }}
                            className={`p-2 border text-xs transition-all ${
                              product.productType === Number(key)
                                ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                                : "border-dark-200 dark:border-dark-700"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <Label>Price (USDC) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.price}
                      onChange={(e) => {
                        const updated = [...batchProducts];
                        updated[index].price = e.target.value;
                        setBatchProducts(updated);
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setBatchProducts([
                  ...batchProducts,
                  {
                    name: "",
                    description: "",
                    productType: ProductType.PRODUCT,
                    price: "",
                  },
                ]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Product
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowBatchModal(false);
                setBatchProducts([
                  {
                    name: "",
                    description: "",
                    productType: ProductType.PRODUCT,
                    price: "",
                  },
                ]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleBatchCreate}
              isLoading={registryLoading}
            >
              Create All ({batchProducts.length})
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatKES } from '@/lib/formatters'
import { useCompareStore } from '@/stores/compare'
import { useCartStore } from '@/stores/cart'
import { Trash2, X, ShoppingBag } from 'lucide-react'

function fmt(n: number) { return formatKES(n) }

export default function ComparePage() {
    const { products, removeProduct, clearCompare } = useCompareStore()
    const { addItem } = useCartStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="pdp-root" style={{ minHeight: '100vh', padding: '2rem' }}>
                <p>Loading...</p>
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="pdp-root" style={{ minHeight: '100vh', padding: '4rem 2rem' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
                        No products to compare
                    </h1>
                    <p style={{ color: 'var(--sub)', marginBottom: '2rem' }}>
                        Add products to compare their features and prices side by side.
                    </p>
                    <Link
                        href="/store"
                        className="btn-primary"
                        style={{
                            display: 'inline-block',
                            textDecoration: 'none',
                            padding: '1rem 2rem'
                        }}
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        )
    }

    // Collect all unique spec keys from all products
    const allSpecKeys = new Set<string>()
    products.forEach((p: any) => {
        if (p.specs && typeof p.specs === 'object') {
            Object.values(p.specs).forEach(group => {
                if (group && typeof group === 'object') {
                    Object.keys(group).forEach(key => allSpecKeys.add(key))
                }
            })
        }
    })

    const specKeysArray = Array.from(allSpecKeys)

    const handleAddToCart = (product: any) => {
        addItem({
            id: `${product.id}-default`,
            product_id: product.id,
            variant_id: '',
            title: product.name,
            quantity: 1,
            unit_price: product.price,
            thumbnail: product.thumbnail_url,
        })
    }

    return (
        <div className="pdp-root" style={{ padding: '2rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>
                        Compare Products ({products.length})
                    </h1>
                    <button
                        onClick={clearCompare}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--sub)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 600
                        }}
                    >
                        <Trash2 className="w-4 h-4" /> Clear All
                    </button>
                </div>

                {/* Compare Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        background: 'var(--surface)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}>
                        <thead>
                            <tr>
                                <th style={{
                                    width: '200px',
                                    padding: '1rem',
                                    textAlign: 'left',
                                    background: 'var(--surface2)',
                                    borderBottom: '1px solid var(--border)'
                                }}></th>
                                {products.map(product => (
                                    <th key={product.id} style={{
                                        padding: '1rem',
                                        verticalAlign: 'top',
                                        background: 'var(--surface2)',
                                        borderBottom: '1px solid var(--border)',
                                        position: 'relative',
                                        minWidth: '250px'
                                    }}>
                                        <button
                                            onClick={() => removeProduct(product.id)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--sub)',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        <div style={{ aspectRatio: '1', marginBottom: '1rem', background: 'var(--bg)', borderRadius: '8px', overflow: 'hidden' }}>
                                            {product.thumbnail_url ? (
                                                <img
                                                    src={product.thumbnail_url}
                                                    alt={product.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'var(--border)',
                                                    borderRadius: '8px'
                                                }} />
                                            )}
                                        </div>

                                        <Link
                                            href={`/products/${product.slug}`}
                                            style={{
                                                color: 'var(--text)',
                                                textDecoration: 'none',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                display: 'block',
                                                marginBottom: '0.5rem'
                                            }}
                                        >
                                            {product.name}
                                        </Link>

                                        <div style={{
                                            color: 'var(--accent)',
                                            fontWeight: 900,
                                            fontSize: '1.1rem',
                                            marginBottom: '1rem'
                                        }}>
                                            {fmt(product.price)}
                                        </div>

                                        <button
                                            className="btn-primary"
                                            style={{
                                                marginTop: '1rem',
                                                padding: '10px',
                                                fontSize: '12px',
                                                width: '100%'
                                            }}
                                            onClick={() => handleAddToCart(product)}
                                        >
                                            <ShoppingBag className="w-4 h-4" style={{ marginRight: '6px' }} />
                                            Add to Bag
                                        </button>
                                    </th>
                                ))}
                                {/* Empty columns to reach 4 */}
                                {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                                    <th key={`empty-${i}`} style={{
                                        padding: '1rem',
                                        background: 'var(--surface2)',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <Link
                                            href="/store"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '300px',
                                                border: '2px dashed var(--border)',
                                                borderRadius: '12px',
                                                color: 'var(--sub)',
                                                textDecoration: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}
                                        >
                                            + Add Product
                                        </Link>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Brand Row */}
                            <tr>
                                <td style={{
                                    padding: '1rem',
                                    fontWeight: 700,
                                    color: 'var(--sub)',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    Brand
                                </td>
                                {products.map(product => (
                                    <td key={product.id} style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--border)',
                                        fontWeight: 600
                                    }}>
                                        {product.brand_type || '-'}
                                    </td>
                                ))}
                                {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                                    <td key={`empty-${i}`} style={{ borderBottom: '1px solid var(--border)' }} />
                                ))}
                            </tr>

                            {/* Spec Rows */}
                            {specKeysArray.map(specKey => (
                                <tr key={specKey}>
                                    <td style={{
                                        padding: '1rem',
                                        fontWeight: 700,
                                        color: 'var(--sub)',
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        {specKey}
                                    </td>
                                    {products.map((product: any) => {
                                        let value = '-'
                                        if (product.specs && typeof product.specs === 'object') {
                                            Object.values(product.specs).forEach((group: any) => {
                                                if (group && typeof group === 'object' && (group as Record<string, unknown>)[specKey]) {
                                                    value = String((group as Record<string, unknown>)[specKey])
                                                }
                                            })
                                        }
                                        return (
                                            <td key={product.id} style={{
                                                padding: '1rem',
                                                borderBottom: '1px solid var(--border)',
                                                fontWeight: 500
                                            }}>
                                                {value}
                                            </td>
                                        )
                                    })}
                                    {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                                        <td key={`empty-${i}`} style={{ borderBottom: '1px solid var(--border)' }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

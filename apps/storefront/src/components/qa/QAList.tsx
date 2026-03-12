'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageCircle, ThumbsUp, ThumbsDown, Plus } from 'lucide-react'

interface QAItem {
    id: string
    product_id: string
    customer_name: string | null
    customer_email: string | null
    question: string
    answer: string | null
    is_approved: boolean
    is_verified_purchase: boolean | null
    helpful_count: number
    not_helpful_count: number
    created_at: string
    answered_at: string | null
}

interface QAListProps {
    productId: string
}

export function QAList({ productId }: QAListProps) {
    const [questions, setQuestions] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted || !productId) return
        fetchQuestions()
    }, [productId, mounted])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('product_questions')
                .select('*')
                .eq('product_id', productId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setQuestions(data)
            }
        } catch (err) {
            console.error('Error fetching questions:', err)
        }
        setLoading(false)
    }

    const handleVote = async (questionId: string, isHelpful: boolean) => {
        const column = isHelpful ? 'helpful_count' : 'not_helpful_count'
        
        const { error } = await supabase
            .from('product_questions')
            .increment(column, 1)
            .eq('id', questionId)

        if (!error) {
            setQuestions(questions.map(q => 
                q.id === questionId 
                    ? { ...q, [column]: q[column] + 1 }
                    : q
            ))
        }
    }

    if (!mounted) {
        return <div className="py-8 text-center text-muted-foreground">Loading...</div>
    }

    if (loading) {
        return <div className="py-8 text-center text-muted-foreground">Loading questions...</div>
    }

    if (questions.length === 0) {
        return (
            <div className="py-8">
                <p className="text-center text-muted-foreground mb-4">
                    No questions yet. Be the first to ask!
                </p>
                <div className="text-center">
                    <button 
                        onClick={() => setShowForm(true)}
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus className="w-4 h-4" />
                        Ask a Question
                    </button>
                </div>
                {showForm && (
                    <QAForm 
                        productId={productId} 
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false)
                            fetchQuestions()
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="qa-section">
            {/* Ask Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                padding: '14px 16px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '4px'
            }}>
                <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>Have a question about this product?</p>
                    <span style={{ fontSize: '12px', color: 'var(--sub)' }}>
                        Get answers from the seller or other customers
                    </span>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    style={{
                        background: 'var(--accent)',
                        color: 'var(--dark)',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Ask a Question
                </button>
            </div>

            {/* Questions List */}
            <div className="qa-list" style={{ display: 'flex', flexDirection: 'column' }}>
                {questions.map((q) => (
                    <div 
                        key={q.id} 
                        style={{ 
                            padding: '16px 0', 
                            borderBottom: '1px solid var(--border)' 
                        }}
                    >
                        {/* Question */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--dark)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 800,
                                flexShrink: 0
                            }}>Q</span>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 500 }}>{q.question}</p>
                                <span style={{ fontSize: '11px', color: 'var(--sub)' }}>
                                    {q.customer_name || 'Anonymous'} · {new Date(q.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Answer */}
                        {q.answer && (
                            <div style={{ display: 'flex', gap: '10px', paddingLeft: '32px', marginBottom: '10px' }}>
                                <span style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    color: 'var(--dark)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    flexShrink: 0
                                }}>A</span>
                                <div>
                                    <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{q.answer}</p>
                                    <span style={{ fontSize: '11px', color: 'var(--sub)' }}>
                                        Trovestak · {q.answered_at ? new Date(q.answered_at).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Votes */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            marginTop: '10px',
                            paddingLeft: '32px',
                            fontSize: '12px',
                            color: 'var(--sub)'
                        }}>
                            <span>Helpful?</span>
                            <button 
                                onClick={() => handleVote(q.id, true)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    borderRadius: '3px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <ThumbsUp className="w-3 h-3" />
                                Yes ({q.helpful_count || 0})
                            </button>
                            <button 
                                onClick={() => handleVote(q.id, false)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    borderRadius: '3px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <ThumbsDown className="w-3 h-3" />
                                No ({q.not_helpful_count || 0})
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* QA Form Modal */}
            {showForm && (
                <QAForm 
                    productId={productId} 
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false)
                        fetchQuestions()
                    }}
                />
            )}
        </div>
    )
}

// QA Form Component
interface QAFormProps {
    productId: string
    onClose: () => void
    onSuccess: () => void
}

function QAForm({ productId, onClose, onSuccess }: QAFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [question, setQuestion] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!question.trim()) return

        setSubmitting(true)
        const { error } = await supabase
            .from('product_questions')
            .insert({
                product_id: productId,
                customer_name: name || null,
                customer_email: email || null,
                question: question,
                is_approved: false // Requires admin approval
            })

        setSubmitting(false)
        
        if (!error) {
            setMessage({ type: 'success', text: 'Question submitted! It will be visible after admin approval.' })
            setTimeout(() => {
                onSuccess()
            }, 1500)
        } else {
            setMessage({ type: 'error', text: 'Error submitting question. Please try again.' })
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 500
        }} onClick={onClose}>
            <div 
                style={{
                    background: 'var(--surface)',
                    borderRadius: '8px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '90%'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                    Ask a Question
                </h3>
                {message && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        background: message.type === 'success' ? 'rgba(0,128,0,0.1)' : 'rgba(128,0,0,0.1)',
                        color: message.type === 'success' ? 'green' : 'red',
                        fontSize: '14px'
                    }}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                            Your Name (optional)
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                            placeholder="John Doe"
                        />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                            Email (optional)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                            Your Question *
                        </label>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            required
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical'
                            }}
                            placeholder="What would you like to know about this product?"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !question.trim()}
                            style={{
                                background: 'var(--accent)',
                                color: 'var(--dark)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

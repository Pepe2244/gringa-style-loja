'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { trackBreadcrumbClick } from '@/utils/analytics';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    const handleClick = (path: string, index: number) => {
        trackBreadcrumbClick(path, index);
    };

    const firstIsHome =
        items.length > 0 &&
        (items[0].label.trim().toLowerCase() === 'início' ||
            items[0].label.trim().toLowerCase() === 'inicio');

    const rootHref = firstIsHome && items[0].href ? items[0].href : '/loja';
    const normalizedItems = firstIsHome ? items.slice(1) : items;

    return (
        <nav aria-label="breadcrumb" className="breadcrumbs" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 0',
            fontSize: '0.9rem',
            color: '#888',
            flexWrap: 'wrap'
        }}>
            <Link 
                href={rootHref}
                onClick={() => handleClick(rootHref, 0)}
                style={{
                    color: 'var(--cor-destaque)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
                Início
            </Link>

            {normalizedItems.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={16} style={{ color: '#666' }} />
                    {item.href ? (
                        <Link
                            href={item.href}
                            onClick={() => handleClick(item.href || '', index + 1)}
                            style={{
                                color: 'var(--cor-destaque)',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span style={{ color: '#999' }}>{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}

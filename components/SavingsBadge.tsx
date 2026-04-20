'use client';

interface SavingsBadgeProps {
    originalPrice: number;
    promotionalPrice?: number | null;
}

export default function SavingsBadge({ originalPrice, promotionalPrice }: SavingsBadgeProps) {
    if (!promotionalPrice || promotionalPrice >= originalPrice) {
        return null;
    }

    const savingsAmount = originalPrice - promotionalPrice;
    const savingsPercentage = Math.round((savingsAmount / originalPrice) * 100);

    return (
        <div 
            className="savings-badge"
            style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff9999 100%)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                marginBottom: '10px'
            }}
            title={`Economize R$ ${savingsAmount.toFixed(2)}`}
        >
            🎉 Economize {savingsPercentage}% - R$ {savingsAmount.toFixed(2).replace('.', ',')}
        </div>
    );
}

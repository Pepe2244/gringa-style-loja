export default function ProductCardSkeleton() {
    return (
        <div className="produto-card skeleton-card">
            <div className="skeleton-image pulse"></div>
            <div className="produto-info">
                <div className="skeleton-text title pulse"></div>
                <div className="skeleton-text price pulse"></div>
                <div className="skeleton-button pulse"></div>
            </div>
            <style jsx>{`
                .skeleton-card {
                    background: #222;
                    border: 1px solid #333;
                    overflow: hidden;
                }
                .skeleton-image {
                    width: 100%;
                    height: 250px;
                    background: #333;
                }
                .skeleton-text {
                    background: #333;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                .skeleton-text.title {
                    height: 24px;
                    width: 80%;
                }
                .skeleton-text.price {
                    height: 32px;
                    width: 50%;
                }
                .skeleton-button {
                    height: 40px;
                    width: 100%;
                    background: #333;
                    border-radius: 5px;
                    margin-top: 15px;
                }
                .pulse {
                    animation: pulse 1.5s infinite ease-in-out;
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}

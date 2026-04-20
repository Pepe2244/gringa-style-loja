/**
 * ANALYTICS TRACKING UTILITY
 * Centraliza todos os eventos de tracking para Google Analytics
 */

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params || {});
    }
};

export const trackButtonClick = (buttonId: string, buttonName: string, context?: string) => {
    trackEvent('button_click', {
        button_id: buttonId,
        button_name: buttonName,
        context: context || 'unknown',
        timestamp: new Date().toISOString()
    });
};

export const trackFormInteraction = (formName: string, fieldName: string, action: 'focus' | 'blur' | 'change') => {
    trackEvent('form_interaction', {
        form_name: formName,
        field_name: fieldName,
        action: action,
        timestamp: new Date().toISOString()
    });
};

export const trackFormSubmit = (formName: string, fieldsCount: number) => {
    trackEvent('form_submit', {
        form_name: formName,
        fields_count: fieldsCount,
        timestamp: new Date().toISOString()
    });
};

export const trackFormAbandon = (formName: string, completionPercentage: number) => {
    trackEvent('form_abandon', {
        form_name: formName,
        completion_percentage: completionPercentage,
        timestamp: new Date().toISOString()
    });
};

export const trackScrollDepth = (pageSection: string, depth: number) => {
    trackEvent('scroll_depth', {
        page_section: pageSection,
        depth_percentage: depth,
        timestamp: new Date().toISOString()
    });
};

export const trackSearchQuery = (query: string, resultsCount: number) => {
    trackEvent('search_query', {
        search_term: query,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
    });
};

export const trackFilterUsage = (filterType: string, filterValue: string) => {
    trackEvent('filter_applied', {
        filter_type: filterType,
        filter_value: filterValue,
        timestamp: new Date().toISOString()
    });
};

export const trackVariantSelection = (productId: number, productName: string, variantType: string, variantValue: string) => {
    trackEvent('variant_selected', {
        product_id: productId,
        product_name: productName,
        variant_type: variantType,
        variant_value: variantValue,
        timestamp: new Date().toISOString()
    });
};

export const trackCouponApplication = (couponCode: string, discountAmount: number, success: boolean) => {
    trackEvent('coupon_applied', {
        coupon_code: couponCode,
        discount_amount: discountAmount,
        success: success,
        timestamp: new Date().toISOString()
    });
};

export const trackNewsletterSignup = (success: boolean, email?: string) => {
    trackEvent('newsletter_signup', {
        success: success,
        email_domain: email ? email.split('@')[1] : 'unknown',
        timestamp: new Date().toISOString()
    });
};

export const trackWishlistAction = (action: 'add' | 'remove', productId: number, productName: string) => {
    trackEvent('wishlist_action', {
        action: action,
        product_id: productId,
        product_name: productName,
        timestamp: new Date().toISOString()
    });
};

export const trackRecentlyViewed = (productId: number, productName: string) => {
    trackEvent('product_view_recorded', {
        product_id: productId,
        product_name: productName,
        timestamp: new Date().toISOString()
    });
};

export const trackImageZoom = (productId: number, imageIndex: number) => {
    trackEvent('image_zoomed', {
        product_id: productId,
        image_index: imageIndex,
        timestamp: new Date().toISOString()
    });
};

export const trackProductShare = (productId: number, productName: string, platform: string) => {
    trackEvent('product_shared', {
        product_id: productId,
        product_name: productName,
        platform: platform,
        timestamp: new Date().toISOString()
    });
};

export const trackBreadcrumbClick = (breadcrumbPath: string, level: number) => {
    trackEvent('breadcrumb_clicked', {
        breadcrumb_path: breadcrumbPath,
        level: level,
        timestamp: new Date().toISOString()
    });
};

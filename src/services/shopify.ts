import env from '../config/env';
import { ProductItem } from '../types/product';

const STORE_DOMAIN = 'shoutmyband.co.uk';
const STOREFRONT_API_VERSION = '2025-01';

const PRODUCTS_QUERY = `
  query FetchProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          onlineStoreUrl
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchProducts(count = 20): Promise<ProductItem[]> {
  if (!env.shopifyStorefrontToken) {
    throw new Error('EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is not set in your .env file.');
  }

  const res = await fetch(
    `https://${STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': env.shopifyStorefrontToken,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { first: count } }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Shopify Storefront API error: ${res.status} — ${body}`);
  }
  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? 'Shopify API error');
  }

  return (json.data?.products?.edges ?? []).map((edge: any) => {
    const node = edge.node;
    const amount = parseFloat(node.priceRange.minVariantPrice.amount);
    const currency = node.priceRange.minVariantPrice.currencyCode;
    return {
      id: node.id as string,
      title: node.title as string,
      price: `${currency} ${amount.toFixed(2)}`,
      imageUrl: node.images.edges[0]?.node?.url ?? '',
      url: node.onlineStoreUrl ?? getStoreHomeUrl(),
    } satisfies ProductItem;
  });
}

export function getStoreHomeUrl(): string {
  return `https://${STORE_DOMAIN}/`;
}

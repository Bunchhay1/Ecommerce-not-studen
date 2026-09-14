import { Injectable } from '@nestjs/common';
import { UsersClient } from '../users/users.client';
import { OrdersClient } from '../orders/orders.client';
import { CatalogClient } from '../catalog/catalog.client';
import { SellersClient } from '../sellers/sellers.client';

@Injectable()
export class SearchService {
  constructor(
    private readonly usersClient: UsersClient,
    private readonly ordersClient: OrdersClient,
    private readonly catalogClient: CatalogClient,
    private readonly sellersClient: SellersClient,
  ) {}

  async globalSearch(query: string) {
    if (!query || query.trim().length === 0) {
      return { users: [], orders: [], products: [], sellers: [] };
    }

    const q = query.trim();

    const [users, orders, products, sellers] = await Promise.all([
      this.usersClient.getUsers({ search: q, limit: 5 }).catch(() => ({ items: [] })),
      this.ordersClient.getOrders({ search: q, limit: 5 }).catch(() => ({ items: [] })),
      this.catalogClient.getProducts({ search: q, limit: 5 }).catch(() => ({ items: [] })),
      this.sellersClient.getSellers({ search: q, limit: 5 }).catch(() => ({ items: [] })),
    ]);

    return {
      query: q,
      results: {
        users: users.items || [],
        orders: orders.items || [],
        products: products.items || [],
        sellers: sellers.items || [],
      },
    };
  }
}

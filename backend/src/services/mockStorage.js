/**
 * Mock in-memory storage for testing without database
 * Items will be lost when server restarts
 */

class MockStorage {
  constructor() {
    this.items = [];
    this.users = [];
  }

  // Items
  async createItem(itemData) {
    const item = {
      ...itemData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.items.push(item);
    return item;
  }

  async getItems(userId, filters = {}) {
    let results = this.items.filter(item => item.user_id === userId);

    // Apply filters
    if (filters.contentType) {
      results = results.filter(item => item.content_type === filters.contentType);
    }

    if (filters.tags) {
      results = results.filter(item =>
        item.tags && item.tags.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.isFavorite !== undefined) {
      results = results.filter(item => item.is_favorite === filters.isFavorite);
    }

    if (filters.isArchived !== undefined) {
      results = results.filter(item => item.is_archived === filters.isArchived);
    }

    // Sort by created_at descending
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const limit = parseInt(filters.limit) || 50;
    const offset = parseInt(filters.offset) || 0;

    return results.slice(offset, offset + limit);
  }

  async getItemById(id, userId) {
    return this.items.find(item => item.id === id && item.user_id === userId);
  }

  async updateItem(id, userId, updates) {
    const index = this.items.findIndex(item => item.id === id && item.user_id === userId);

    if (index === -1) {
      return null;
    }

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updated_at: new Date()
    };

    return this.items[index];
  }

  async deleteItem(id, userId) {
    const index = this.items.findIndex(item => item.id === id && item.user_id === userId);

    if (index === -1) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }

  // Get stats
  getStats() {
    return {
      totalItems: this.items.length,
      itemsByType: this.items.reduce((acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Clear all data (for testing)
  clear() {
    this.items = [];
    this.users = [];
  }
}

module.exports = new MockStorage();

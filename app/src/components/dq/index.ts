// Import data query Interfaces
import DrinkDq from './queries/DrinkDq';
import TokenDq from './queries/TokenDq';
import UserDq from './queries/UserDq';

// Export all other resources
export * from './queries/DrinkDq';
export * from './queries/TokenDq';
export * from './queries/UserDq';

// Export data query interfaces
export const users = new UserDq();
export const drinks = new DrinkDq();
export const tokens = new TokenDq();

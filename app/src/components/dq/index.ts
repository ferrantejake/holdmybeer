// Import data query Interfaces
import DrinkDq from './queries/DrinkDq';
import TokenDq from './queries/TokenDq';
import UserDq from './queries/UserDq';
import BeerLogDq from './queries/BeerLogDq';

// Export all other resources
export * from './queries/DrinkDq';
export * from './queries/TokenDq';
export * from './queries/UserDq';
export * from './queries/BeerLogDq';

// Export data query interfaces
export const users = new UserDq();
export const drinks = new DrinkDq();
export const tokens = new TokenDq();
export const beerlogs = new BeerLogDq();

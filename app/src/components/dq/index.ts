// Import data query Interfaces
import { DrinkDq } from './queries/DrinkDq';
import { TokenDq } from './queries/TokenDq';
import { UserDq } from './queries/UserDq';

const dq = {
    users: new UserDq(),
    drinks: new DrinkDq(),
    tokens: new TokenDq()
};

// Export data query interfaces
export { dq };
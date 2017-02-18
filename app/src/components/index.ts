import { DrinkDq, UserDq } from './dq';
import { aws } from './aws';

const dq = {
    users: new UserDq(),
    drinks: new DrinkDq()
};

export {
    dq,
    aws
};
import './models';
import Knex from 'knex';
import { Model } from 'objection';
import knexConfig from '../knexfile';

const env = process.env.NODE_ENV!;
const knex = Knex(knexConfig[env]);

Model.knex(knex);

export default knex;

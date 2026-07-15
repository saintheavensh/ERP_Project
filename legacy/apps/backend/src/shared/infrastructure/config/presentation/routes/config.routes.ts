import { Hono } from 'hono';
import { container } from "../../../../../shared/core/container";
import { TYPES } from "../../../../../shared/core/types";
import { ConfigController } from '../controllers/ConfigController';

export const configRoutes = new Hono();

const getController = () => container.get<ConfigController>(TYPES.ConfigController);

// System settings (explicit with scope)
configRoutes.get('/system/:key', (c) => getController().getSystemConfig(c));
configRoutes.put('/system/:key', (c) => getController().updateConfig(c));

// Generic setting routes used by frontend (assumes system scope by default)
configRoutes.get('/', (c) => getController().getAllSettings(c));
configRoutes.get('/:key', (c) => getController().getSystemConfig(c));
configRoutes.put('/:key', (c) => getController().updateConfig(c));

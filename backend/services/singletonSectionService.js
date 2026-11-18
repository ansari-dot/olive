import { invalidateCache } from "../middlewares/cache.js";

/**
 * Build a thin service for a "singleton" section document — a single document
 * per collection that is read with `findOne` and updated with `upsert`.
 * Used by the homepage sections (hero, collection, popular picks, etc.).
 */
export function createSingletonSectionService(Model, { cachePrefix } = {}) {
    return {
        async get() {
            return Model.findOne().lean();
        },
        async upsert(payload) {
            const doc = await Model.findOneAndUpdate({}, payload, {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }).lean();
            if (cachePrefix) {
                invalidateCache(cachePrefix);
                invalidateCache("/api/home");
            }
            return doc;
        },
    };
}
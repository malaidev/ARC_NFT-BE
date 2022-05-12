import { config } from "../../../config/config";
import {
  createItem,
  batchUpload,
  deleteItem,
  getAllItems,
  getItemDetail,
  getItemHistory,
  getItemOffers,
  getTrendingItems,
  updateItem,
  getTagItems,
} from "./item";

import {
  getCollections,
  getActivities,
  getHistory,
  getItems,
  getOwners,
  createCollection,
  getCollectionDetail,
  getCollectionByUrl,
  getTopCollections,
  getCollectionsItems,
  deleteCollection,
  getCollectionOffer,
  updateCollection,
  getHotCollections,
  getTagCollections,
} from "./collection";
import {
  createOwner,
  getAllOwners,
  getOwner,
  getOwnerCollection,
  getOwnerHistory,
  getOwnerNtfs,
  getOwnerOffers,
  updateOwner,
  uploadOwnerPhoto,
} from "./owner";
import {
  approveOffer,
  makeOffer,
  getAllActivites,
  listForSale,
  transfer,
  cancelOffer,
  cancelListForSale,
  makeCollectionOffer,
  cancelCollectionOffer,
  signOffer,
  deleteActivityId,
} from "./activity";
import { claimReward, getReward, getRewardAirDrop, getTest } from "./reward";

/**
 * Exports the nft collection actions routes.
 * @param {*} router
 * @param {*} options
 */
export const nft = async (router: any, options: any) => {
  /**
   * remove auth
   */
  router.get("/collection", getCollections);
  router.get("/collection/top", getTopCollections);
  router.get("/collection/hot", getHotCollections);
  router.get("/collection/url/:url", getCollectionByUrl);
  router.get("/collection/:collectionId/items", config.routeParamsValidation(), getItems);
  router.get("/collection/:collectionId/owners", config.routeParamsValidation(), getOwners);
  router.get("/collection/:collectionId/history", config.routeParamsValidation(), getActivities);
  router.get("/collection/:collectionId/activity", config.routeParamsValidation(), getActivities);
  router.get("/collection/:collectionId/offer", config.routeParamsValidation(), getCollectionOffer);

  router.get("/collection/:collectionId", config.routeParamsValidation(), getCollectionDetail);
  router.get("/collection/tag/:tag", config.routeParamsValidation(), getTagCollections);
  router.delete("/collection/:collectionId", config.route("jwt"), deleteCollection);
  router.put("/collection/:collectionId", config.route("jwt"), updateCollection);
  router.post("/collection/create", config.route("jwt"), createCollection);
  router.get("/activity", getAllActivites);
  router.delete("/activity/:id", config.route("jwt"), deleteActivityId);
  router.post("/activity/listForSale", config.route("jwt"), listForSale);
  router.post("/activity/makeOffer", config.route("jwt"), makeOffer);
  router.post("/activity/approveOffer", config.route("jwt"), approveOffer);
  router.post("/activity/transfer", config.route("jwt"), transfer);
  router.post("/activity/cancelOffer", config.route("jwt"), cancelOffer);
  router.post("/activity/cancelListForSale", config.route("jwt"), cancelListForSale);
  router.post("/activity/makeCollectionOffer", config.route("jwt"), makeCollectionOffer);
  router.post("/activity/cancelCollectionOffer", config.route("jwt"), cancelCollectionOffer);
  router.post("/activity/signOffer", config.route("jwt"), signOffer);

  router.get("/items", getAllItems);
  router.get("/items/trending", getTrendingItems);
  router.get("/items/tag/:tag", getTagItems);
  router.post("/items/create", config.route("jwt"), createItem);
  router.post("/items/batch-upload", config.route("jwt"), batchUpload);
  router.get("/items/:collectionId/:nftId/history", config.routeParamsValidation(), getItemHistory);
  router.get("/items/:collectionId/:nftId/offers", config.routeParamsValidation(), getItemOffers);
  router.get("/items/:collectionId/:nftId", config.routeParamsValidation(), getItemDetail);
  router.put("/items/:nftId", config.route("jwt"), updateItem);
  router.delete("/items/:id", config.route("jwt"), deleteItem);

  router.get("/owners", getAllOwners);
  router.post("/owners/:ownerId", config.route("jwt"), createOwner);
  router.post("/owners/:ownerId/upload-profile", config.route("jwt"), uploadOwnerPhoto);
  router.put("/owners/:ownerId", config.route("jwt"), updateOwner);
  router.get("/owners/:ownerId", config.routeParamsValidation(), getOwner);
  router.get("/owners/:ownerId/nfts", config.routeParamsValidation(), getOwnerNtfs);
  router.get("/owners/:ownerId/history", config.routeParamsValidation(), getOwnerHistory);
  router.get("/owners/:ownerId/collection", config.routeParamsValidation(), getOwnerCollection);
  router.get("/owners/:ownerId/offers", config.routeParamsValidation(), getOwnerOffers);


  router.get("/search", getCollectionsItems);
  router.get("/rewards/:walletId", getReward);
  router.get("/rewards/airdrop/:walletId", getRewardAirDrop);
  router.post("/rewardsClaim",config.route("jwt"), claimReward);
  router.get("/rewards/test", getTest);

};

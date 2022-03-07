import { config } from "../../../config/config";
import { createItem, getAllItems, getItemDetail, getItemHistory, transferItem } from "./item";
import { getProfile, getUserCollections, getUserHistory, getUserLists, updateProfile } from "./user";
import { getActivities, getHistory, getItems, getOwners, createCollection, placeBid } from "./collection";
import { createOwner,getAllOwners, getOwner, updateOwner } from "./owner";

/**
 * Exports the nft collection actions routes.
 * @param {*} router
 * @param {*} options
 */
export const nft = async (router: any, options: any) => {
  router.get("/collection/:contract/items", config.route("jwt"), getItems);
  router.get("/collection/:contract/owners", config.route("jwt"), getOwners);
  router.get("/collection/:contract/history", config.route("jwt"), getHistory);
  router.get("/collection/:contract/activity", config.route("jwt"), getActivities);
  router.post("/collection/create", config.route("jwt"), createCollection);
  router.post("/collection/placeBid", config.route("jwt"), placeBid);

  router.post("/items/create", config.route("jwt"), createItem);
  router.get("/items/:contract", config.route("jwt"), getAllItems);
  router.get("/items/:contract/:nftId/history", config.route("jwt"), getItemHistory);
  router.get("/items/:contract/:nftId/detail", config.route("jwt"), getItemDetail);
  router.post("/items/transfer", config.route("jwt"), transferItem);

  router.get("/owners", config.route("jwt"), getAllOwners);  
  router.post("/owners", config.route("jwt"), createOwner);
  router.get("/owners/:walletId", config.route("jwt"), getOwner);  
  router.put("/owners", config.route("jwt"), updateOwner);
};

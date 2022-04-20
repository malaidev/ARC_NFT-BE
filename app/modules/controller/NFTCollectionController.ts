import { ObjectId } from "mongodb";
import { AbstractEntity } from "../abstract/AbstractEntity";
import { ActivityType, IActivity } from "../interfaces/IActivity";
import { INFT } from "../interfaces/INFT";
import { INFTCollection, OfferStatusType } from "../interfaces/INFTCollection";
import { IPerson } from "../interfaces/IPerson";
import { IResponse } from "../interfaces/IResponse";
import { IQueryFilters } from "../interfaces/Query";
import { respond } from "../util/respond";
import { uploadImage, uploadImageBase64 } from "../util/morailsHelper";
/**
 * This is the NFTCollection controller class.
 * Do all the NFTCollection's functions such as
 * get owners, items, activities, histories,
 * and create, placeBid.
 *
 * @param {INFTCollection} data NFTCollection data
 *
 * @property {data}
 * @property {table}
 * @property {nftTable}
 * @property {ownerTable}
 *
 * @method getOwners
 * @method getItems
 * @method getActivity
 * @method getHistory
 * @method createCollection
 * @method getCollectionDetail
 * @method findCollectionItem
 * @method findPerson
 *
 *
 * @author Tadashi <tadashi@depo.io>
 * @version 0.0.1
 *
 * ----
 * Example Usage
 *
 * const ctl = new NFTCollectionController();
 *
 * await ctl.getOwners('0xbb6a549b1cf4b2d033df831f72df8d7af4412a82')
 *
 */
export class NFTCollectionController extends AbstractEntity {
  protected data: INFTCollection;
  protected table: string = "NFTCollection";
  protected nftTable: string = "NFT";
  protected ownerTable: string = "Person";
  protected activityTable: string = "Activity";
  /**
   * Constructor of class
   * @param nft NFTCollection data
   */
  constructor(nft?: INFTCollection) {
    super();
    this.data = nft;
  }
  /**
   * COMBINE SEARCH COLLECTION AND ITEMS
   * @param keyword
   * @returns collection Array and items Array
   */
  async searchCollectionsItems(keyword: string, filters: IQueryFilters): Promise<void | IResponse> {
    try {
      if (this.mongodb) {
        const collectionTable = this.mongodb.collection(this.table);
        const nftTable = this.mongodb.collection(this.nftTable);
        const ownerTable = this.mongodb.collection(this.ownerTable);
        let SK = keyword.split(" ");
        SK.push(keyword);
        let searchKeyword = SK.map(function (e) {
          return new RegExp(e, "igm");
        });
        // let aggregation = [] as any;
        // if (filters) {
        //   aggregation = this.parseFilters(filters);
        // }
        // const result = (await collectionTable.aggregate(aggregation).toArray()) as Array<INFTCollection>;
        const result = (await collectionTable
          .find({
            $or: [
              { name: { $in: searchKeyword } },
              { description: { $in: searchKeyword } },
              { blockchain: { $regex: new RegExp(keyword, "igm") } },
              { category: { $in: searchKeyword } },
              { platform: { $in: searchKeyword } },
              { links: { $in: searchKeyword } },
              { "properties.name": { $in: searchKeyword } },
              { "properties.title": { $in: searchKeyword } },
            ],
          })
          .toArray()) as Array<INFTCollection>;
        let collections = [];
        if (result) {
          collections = await Promise.all(
            result.map(async (collection) => {
              let volume = 0;
              let floorPrice = 0;
              let owners = [];
              const nfts = (await nftTable.find({ collection: collection.contract }).toArray()) as Array<INFT>;
              nfts.forEach((nft) => {
                volume += nft.price;
                if (floorPrice > nft.price) floorPrice = nft.price;
                if (owners.indexOf(nft.owner) == -1) owners.push(nft.owner);
              });
              const { _24h, todayTrade } = await this.get24HValues(collection.contract);
              const creator = (await ownerTable.findOne(this.findPerson(collection.creator))) as IPerson;
              floorPrice = await this.getFloorPrice(`${collection._id}`);
              return {
                _id: collection._id,
                logoUrl: collection.logoUrl,
                featuredUrl: collection.featuredUrl,
                bannerUrl: collection.bannerUrl,
                contract: collection.contract,
                creator: collection.creator,
                creatorDetail: creator,
                url: collection.url,
                description: collection.description,
                category: collection.category,
                links: collection.links,
                name: collection.name,
                blockchain: collection.blockchain,
                volume: volume,
                _24h: todayTrade,
                _24hPercent: _24h,
                floorPrice: floorPrice,
                owners: owners.length,
                items: nfts.length,
                isVerified: collection.isVerified,
                isExplicit: collection.isExplicit,
                properties: collection.properties,
                platform: collection.platform,
                offerStatus: collection.offerStatus,
              };
            })
          );
        }
        // const resultNft = (await nftTable.aggregate(aggregationNft).toArray()) as Array<INFTCollection>;
        const resultNft = (await nftTable
          .find({
            $or: [
              { collection: { $in: searchKeyword } },
              { index: { $in: searchKeyword } },
              { owner: { $in: searchKeyword } },
              { creator: { $in: searchKeyword } },
              { platform: { $in: searchKeyword } },
              { name: { $in: searchKeyword } },
              { description: { $in: searchKeyword } },
              { tokenType: { $in: searchKeyword } },
              { "properties.name": { $in: searchKeyword } },
              { "properties.title": { $in: searchKeyword } },
            ],
          })
          .toArray()) as Array<INFTCollection>;
        let items = [];
        if (resultNft) {
          items = resultNft;
        }
        return respond({
          collections,
          items,
        });
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  async getCollections(filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        const collectionTable = this.mongodb.collection(this.table);
        const nftTable = this.mongodb.collection(this.nftTable);
        const ownerTable = this.mongodb.collection(this.ownerTable);
        let aggregation = {} as any;
        // const result = await collectionTable.find().toArray() as Array<INFTCollection>;
        if (filters) {
          aggregation = this.parseFilters(filters);
        }
        const result = (await collectionTable.aggregate(aggregation).toArray()) as Array<INFTCollection>;
        if (result) {
          const collections = await Promise.all(
            result.map(async (collection) => {
              let volume = 0;
              let floorPrice = 0;
              let owners = [];
              const nfts = (await nftTable.find({ collection: `${collection._id}` }).toArray()) as Array<INFT>;
              nfts.forEach((nft) => {
                volume += nft.price;
                if (floorPrice > nft.price) floorPrice = nft.price;
                if (owners.indexOf(nft.owner) == -1) owners.push(nft.owner);
              });
              const { _24h, todayTrade } = await this.get24HValues(collection.contract);
              const creator = (await ownerTable.findOne(this.findPerson(collection.creator))) as IPerson;
              floorPrice = await this.getFloorPrice(`${collection._id}`);
              return {
                _id: collection._id,
                logoUrl: collection.logoUrl,
                featuredUrl: collection.featuredUrl,
                bannerUrl: collection.bannerUrl,
                contract: collection.contract,
                creator: collection.creator,
                creatorDetail: creator,
                url: collection.url,
                description: collection.description,
                category: collection.category,
                links: collection.links,
                name: collection.name,
                blockchain: collection.blockchain,
                volume: volume,
                _24h: todayTrade,
                _24hPercent: _24h,
                floorPrice: floorPrice,
                owners: owners.length,
                items: nfts.length,
                isVerified: collection.isVerified,
                isExplicit: collection.isExplicit,
                properties: collection.properties,
                platform: collection.platform,
                offerStatus: collection.offerStatus,
              };
            })
          );
          return respond(collections);
        }
        return respond("collection not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  async getTopCollections(filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        const collectionTable = this.mongodb.collection(this.table);
        const nftTable = this.mongodb.collection(this.nftTable);
        const ownerTable = this.mongodb.collection(this.ownerTable);
        let aggregation = {} as any;
        // const result = await collectionTable.find().toArray() as Array<INFTCollection>;
        if (filters) {
          aggregation = this.parseFilters(filters);
        }
        const result = (await collectionTable.aggregate(aggregation).toArray()) as Array<INFTCollection>;
        if (result) {
          const collections = await Promise.all(
            result.map(async (collection) => {
              let volume = 0;
              let floorPrice = 0;
              let owners = [];
              const nfts = (await nftTable.find({ collection: collection.contract }).toArray()) as Array<INFT>;
              nfts.forEach((nft) => {
                volume += nft.price;
                if (floorPrice > nft.price) floorPrice = nft.price;
                if (owners.indexOf(nft.owner) == -1) owners.push(nft.owner);
              });
              const { _24h, todayTrade } = await this.get24HValues(collection.contract);
              const creator = (await ownerTable.findOne(this.findPerson(collection.creator))) as IPerson;
              floorPrice = await this.getFloorPrice(`${collection._id}`);
              return {
                _id: collection._id,
                logoUrl: collection.logoUrl,
                featuredUrl: collection.featuredUrl,
                bannerUrl: collection.bannerUrl,
                contract: collection.contract,
                creator: collection.creator,
                creatorDetail: creator,
                url: collection.url,
                description: collection.description,
                category: collection.category,
                links: collection.links,
                name: collection.name,
                blockchain: collection.blockchain,
                volume: volume,
                _24h: todayTrade,
                _24hPercent: _24h,
                floorPrice: floorPrice,
                owners: owners.length,
                items: nfts.length,
                isVerified: collection.isVerified,
                isExplicit: collection.isExplicit,
                properties: collection.properties,
                platform: collection.platform,
                offerStatus: collection.offerStatus,
              };
            })
          );
          return respond(collections.sort((item1, item2) => item2.volume - item1.volume).slice(0, 10));
        }
        return respond("collection not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  /**
   * Get owner list in collection
   *
   * @param contract Collection Contract Address
   * @param filters filter
   * @returns {Array<IPerson>} owner list
   */
  async getOwners(collectionId: string, filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        const nftTable = this.mongodb.collection(this.nftTable);
        const ownerTable = this.mongodb.collection(this.ownerTable);
        const query = this.findCollectionItem(collectionId);
        const result = (await this.findOne(query)) as INFTCollection;
        if (result) {
          const nfts = await nftTable.find({ collection: collectionId }).toArray();
          let ownerWallets = nfts.map((nft) => nft.owner);
          ownerWallets = ownerWallets.filter((item, pos) => ownerWallets.indexOf(item) == pos);
          let owners = [];
          owners = await Promise.all(
            ownerWallets.map(async (owner) => {
              const ownerDetail = await ownerTable.findOne({ wallet: owner });
              return ownerDetail;
            })
          );
          return respond(owners);
        }
        return respond("collection not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  /**
   * Get item list in collection
   *
   * @param contract Collection Contract Address
   * @param filters filter
   * @returns {Array<INFT>} item list
   */
  async getItems(collectionId: string, filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        if (!ObjectId.isValid(collectionId)) {
          return respond("Invalid CollectionId", true, 422);
        }
        const nftTable = this.mongodb.collection(this.nftTable);
        const query = this.findCollectionItem(collectionId);
        let aggregation = [] as any;
        const result = await this.findOne(query);
        if (filters) {
          aggregation = this.parseFilters(filters);
        }
        // const nfts = await nftTable.aggregate(aggregation).toArray() as Array<INFT>;
        const nfts = (await nftTable.find({ collection: collectionId }).toArray()) as Array<INFT>;
        if (nfts) {
          result.nfts = nfts;
        } else {
          result.nfts = [];
        }
        if (result) {
          return respond(result);
        }
        return respond("collection items not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  /**
   * Get all activities (bids and transfer) of NFT items in collection
   *
   * @param collectionId Colleciton id
   * @param filters filter
   * @returns {Array<IActivity>} activity list
   */
  async getActivity(collectionId: string, filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        const activityTable = this.mongodb.collection(this.activityTable);
        const nftTable = this.mongodb.collection(this.nftTable);
        const query = this.findCollectionItem(collectionId);
        let aggregation = {} as any;
        const result = (await this.findOne(query)) as INFTCollection;
        if (result) {
          if (filters) {
            aggregation = this.parseFilters(filters);
            aggregation.push({ $match: { collection: collectionId } });
          }
          const activities = await activityTable.aggregate(aggregation).toArray();
          const detailedActivity = await Promise.all(
            activities.map(async (activity) => {
              if (activity.type==ActivityType.OFFERCOLLECTION){
                const nft = await nftTable.find({ collection: activity.collection},{projection:{'artURI':1,'_id':0,'name':1}}).toArray() as Array<INFT>

                  activity.nftObject =nft
                  return activity;
              }else{
                const nft = (await nftTable.findOne({ collection: activity.collection, index: activity.nftId })) as INFT;
                activity.nftObject = { artUri: nft?.artURI, name: nft?.name };
                return activity;
              }
            })
          );
          return respond(detailedActivity);
        }
        return respond("Activities not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  /**
   * Get transfer history of NFT items in collection
   *
   * @param contract Collection Contract Address
   * @param filters filter
   * @returns {Array<IActivity>} history list
   */
  async getHistory(collectionId: string, filters?: IQueryFilters): Promise<IResponse> {
    try {
      if (this.mongodb) {
        const activityTable = this.mongodb.collection(this.activityTable);
        const nftTable = this.mongodb.collection(this.nftTable);
        const query = this.findCollectionItem(collectionId);
        const result = (await this.findOne(query)) as INFTCollection;
        if (result) {
          const history = await activityTable
            // .find({ collection: collectionId, $or: [{ type: "Sold" }, { type: "Transfer" }] })
            .find({ collection: collectionId})
            .toArray();
          
          
          const detailedActivity = await Promise.all( 
            history.map(async (activity) => {
              if (activity.type==ActivityType.OFFERCOLLECTION){
                const nft = await nftTable.find({ collection: activity.collection},{projection:{'artURI':1,'_id':0,'name':1}}).toArray() as Array<INFT>

                  activity.nftObject =nft
                  return activity;
              }else{
                const nft = (await nftTable.findOne({ collection: activity.collection, index: activity.nftId })) as INFT;
                activity.nftObject = { artUri: nft?.artURI, name: nft?.name };
                return activity;
              }
              
            })
          );
          return respond(detailedActivity);
        }
        return respond("collection not found.", true, 422);
      } else {
        throw new Error("Could not connect to the database.");
      }
    } catch (error) {
      return respond(error.message, true, 500);
    }
  }
  /**
   * Create new collection - save to MongoDB
   * It check collection is in database, then fail
   * Otherwise add new collection
   * @param logoFile
   * @param featuredImgFile
   * @param bannerImgFile
   * @param name
   * @param url
   * @param description
   * @param category
   * @param siteUrl
   * @param discordUrl
   * @param instagramUrl
   * @param mediumUrl
   * @param telegramUrl
   * @param creatorEarning
   * @param blockchain
   * @param isExplicit
   * @param creatorId
   * @returns result of creation
   */
  async createCollection(
    logoFile,
    featuredImgFile,
    bannerImgFile,
    name,
    url,
    description,
    category,
    siteUrl,
    discordUrl,
    instagramUrl,
    mediumUrl,
    telegramUrl,
    creatorEarning,
    blockchain,
    isExplicit,
    creatorId,
    logoName,
    featureName,
    bannerName,
    logoMimetype,
    featuredMimetype,
    bannerMimetype
  ): Promise<IResponse> {
    const collection = this.mongodb.collection(this.table);
    const ownerTable = this.mongodb.collection(this.ownerTable);
    try {
      if (!ObjectId.isValid(creatorId)) {
        return respond("Invalid creatorID", true, 422);
      }
      const creator = (await ownerTable.findOne(this.findPersonById(creatorId))) as IPerson;
      if (!creator) {
        return respond("creator address is invalid or missing", true, 422);
      }
      if (name == "" || !name) {
        return respond("name is invalid or missing", true, 422);
      }
      if (blockchain == "" || !blockchain) {
        return respond("blockchain is invalid or missing", true, 422);
      }
      if (category == "" || !category) {
        return respond("category is invalid or missing", true, 422);
      }
      const query = this.findCollectionItemByName(name);
      const findResult = (await collection.findOne(query)) as INFTCollection;
      if (findResult && findResult._id) {
        return respond("Same collection name detected", true, 422);
      }
      if (!url) {
        return respond("Collection url empty", true, 422);
      }
      const findUrl = await collection.findOne({ url });
      if (findUrl && findUrl._id) {
        return respond("Same collection url detected", true, 422);
      }
      let contract = "";
      /** Default contract for ERC721 and ERC1155 */
      if (blockchain == "ERC721") contract = "0x8113901EEd7d41Db3c9D327484be1870605e4144";
      else if (blockchain == "ERC1155") contract = "0xaf8fC965cF9572e5178ae95733b1631440e7f5C8";
      /** Upload contains nft picture into moralis */
      // const logoIpfs = logoFile ? await uploadImageBase64({ name: logoName, img: `${logoFile}_${Date.now()}` }) : "";
      const logoIpfs = logoFile ? await uploadImage({ name: logoName, img: logoFile, contentType:logoMimetype}) : "";
      // const featuredIpfs = featuredImgFile
      //   ? await uploadImageBase64({ name: featureName, img: `${featuredImgFile}_${Date.now()}` })
      //   : "";
      const featuredIpfs = featuredImgFile? await uploadImage({ name: featureName, img: featuredImgFile,contentType:featuredMimetype }): "";
      // const bannerIpfs = bannerImgFile
      //   ? await uploadImageBase64({ name: bannerName, img: `${bannerImgFile}_${Date.now()}` })
      //   : "";
      const bannerIpfs = bannerImgFile? await uploadImage({ name: bannerName, img:bannerImgFile,contentType:bannerMimetype }): "";
      const nftCollection: INFTCollection = {
        name: name,
        contract: contract,
        url,
        creator: creator.wallet.toLowerCase(),
        creatorEarning: creatorEarning,
        blockchain: blockchain,
        isVerified: false,
        isExplicit: isExplicit ?? false,
        logoUrl: logoIpfs,
        featuredUrl: featuredIpfs,
        bannerUrl: bannerIpfs,
        description: description ?? "",
        category: category ?? "",
        links: [siteUrl ?? "", discordUrl ?? "", instagramUrl ?? "", mediumUrl ?? "", telegramUrl ?? ""],
        platform: "ARC",
        properties: {},
        offerStatus: OfferStatusType.NONE,
      };
      const result = await collection.insertOne(nftCollection);
      if (result) nftCollection._id = result.insertedId;
      return result
        ? respond({ ...nftCollection, creator: creator })
        : respond("Failed to create a new collection.", true, 500);
    } catch (e) {
      return respond(e.message, true, 500);
    }
  }
  /**
   * Get collection detail information with items, activity
   * @param collectionId collection Id
   * @returns
   */
  async getCollectionDetail(collectionId: string): Promise<IResponse> {
    const collectionTable = this.mongodb.collection(this.table);
    const nftTable = this.mongodb.collection(this.nftTable);
    const activityTable = this.mongodb.collection(this.activityTable);
    const ownerTable = this.mongodb.collection(this.ownerTable);
    const collection = await collectionTable.findOne(this.findCollectionItem(collectionId));
    if (!collection) {
      return respond("collection not found", true, 501);
    }
    const activities = await activityTable.find({ collection: collectionId }).toArray();
    collection.activities = activities;
    const nfts = await nftTable.find({ collection: collectionId }).toArray();
    collection.nfts = nfts;
    let owners = nfts.map((nft) => nft.owner);
    owners = owners.filter((item, pos) => owners.indexOf(item) == pos);
    const f = await this.getFloorPrice(`${collection._id}`);
    collection.floorPrice = f;
    collection.totalVolume = 0;
    collection.owners = owners.length;
    collection.items = nfts.length;
    const { _24h, todayTrade } = await this.get24HValues(collectionId);
    collection._24h = todayTrade;
    collection._24hPercent = _24h;
    const creator = (await ownerTable.findOne(this.findPerson(collection.creator))) as IPerson;
    collection.creatorDetail = creator;
    return respond(collection);
  }
  /**
   * Get collection detail information with items, activity
   * @param collectionId collection Id
   * @returns
   */
  async getCollectionByUrl(url: string): Promise<IResponse> {
    const collectionTable = this.mongodb.collection(this.table);
    const nftTable = this.mongodb.collection(this.nftTable);
    const activityTable = this.mongodb.collection(this.activityTable);
    const ownerTable = this.mongodb.collection(this.ownerTable);
    const collection = await collectionTable.findOne({ url });
    if (!collection) {
      return respond("collection not found", true, 501);
    }
    const activities = await activityTable.find({ collection: `${collection._id}` }).toArray();
    collection.activities = activities;
    const nfts = await nftTable.find({ collection: `${collection._id}` }).toArray();
    collection.nfts = nfts;
    let owners = nfts.map((nft) => nft.owner);
    owners = owners.filter((item, pos) => owners.indexOf(item) == pos);
    const f = await this.getFloorPrice(`${collection._id}`);
    collection.floorPrice = f;
    collection.totalVolume = 0;
    collection.owners = owners.length;
    collection.items = nfts.length;
    const { _24h, todayTrade } = await this.get24HValues(`${collection._id}`);
    collection._24h = todayTrade;
    collection._24hPercent = _24h;
    const creator = (await ownerTable.findOne(this.findPerson(collection.creator))) as IPerson;
    collection.creatorDetail = creator;
    return respond(collection);
  }
  /**
   * Delete  collection
   * @param collectionId collection Id
   * @returns
   */
  async deleteCollection(collectionId: string, ownerId: string) {
    const collectionTable = this.mongodb.collection(this.table);
    const nftTable = this.mongodb.collection(this.nftTable);
    try {
      if (!ObjectId.isValid(collectionId)) {
        return respond("Invalid CollectionId", true, 422);
      }
      const collection = await collectionTable.findOne(this.findCollectionItem(collectionId));
      if (!collection) {
        return respond("Collection Not found", true, 422);
      }
      const nftData = await nftTable.findOne({ collection: collectionId }, { limit: 1 });
      if (nftData) {
        return respond("This collection has Items", true, 422);
      }
      const deleteCollection = await collectionTable.remove(this.findCollectionItem(collectionId));
      return respond(`Collection ${collectionId} has been removed`);
    } catch (e) {
      return respond(e.message, true, 401);
    }
  }
  /**
   * Mounts a generic query to find a collection by contract address.
   * @param contract
   * @returns
   */
  private findCollectionItem(collectionId: string): Object {
    return {
      _id: new ObjectId(collectionId),
    };
  }
  /**
   * Mounts a generic query to find a collection by contract address.
   * @param contract
   * @returns
   */
  private findCollectionItemByName(name: string): Object {
    return {
      name: name,
    };
  }
  /**
   * Mounts a generic query to find a person by wallet address.
   * @param address
   * @returns
   */
  private findPerson(address: string): Object {
    return {
      wallet: address,
    };
  }
  /**
   * Mounts a generic query to find a person by wallet address.
   * @param contract
   * @returns
   */
  private findPersonById(id: string): Object {
    return {
      _id: new ObjectId(id),
    };
  }
  private async get24HValues(address: string) {
    const activityTable = this.mongodb.collection(this.activityTable);
    const soldList = (await activityTable.find({ collection: address }).toArray()) as Array<IActivity>;
    let yesterDayTrade = 0;
    let todayTrade = 0;
    const todayDate = new Date();
    const yesterdayDate = new Date(todayDate.getTime());
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const dayBeforeDate = new Date(todayDate.getTime());
    dayBeforeDate.setDate(dayBeforeDate.getDate() - 2);
    soldList.forEach((sold) => {
      if (sold.date > yesterdayDate.getTime() / 1000) todayTrade += sold.price;
      else if (sold.date > dayBeforeDate.getTime() / 1000) yesterDayTrade += sold.price;
    });
    let _24h;
    if (todayTrade == 0) _24h = 0;
    else if (yesterDayTrade == 0) _24h = 100;
    else _24h = (todayTrade / yesterDayTrade) * 100;
    return { _24h, todayTrade };
  }
  private async getFloorPrice(collection: string) {
    const actTable = this.mongodb.collection(this.activityTable);
    const fList = (await actTable
      .find(
        { collection: collection, type: { $in: [ActivityType.LIST, ActivityType.SALE] } },
        { limit: 1, sort: { price: 1 } }
      )
      .toArray()) as Array<IActivity>;
    if (fList && fList.length > 0) {
      return fList[0].price;
    } else {
      return 0;
    }
  }
}

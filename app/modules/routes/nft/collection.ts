import { FastifyReply, FastifyRequest } from "fastify";
import { NFTCollectionController } from "../../controller/NFTCollectionController";

/**
 * Get NFT Items in collection
 * Method: GET
 * 
 * @param {*} req
 *    contract: Collection Contract Address
 * @param {*} res
 *    Array<INFT>
      interface INFT {
        _id?: string;                   // id of nft
        collection: string;             // collection contract address
        index: string;                  // index of nft in collection
        owner: IPerson;                 // owner
        creator: IPerson;               // creator
        artURI: string;                 // URI of art image
        price: number;                  // Current price of nft
        like: number;                   // likes count of nft
        auctionEnd?: Date;              // auction end time
        protocol?: string;              // protocol
        priceHistory: Array<IPrice>;    // price history list of nft
        history: Array<IHistory>;       // history list
        status: string;                 // status of current nft
      }
 */
export const getItems = async (req: FastifyRequest, res: FastifyReply) => {
  const contract = req.params['contract'] as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.getItems(contract);
  res.send(result);
};

/**
 * Get owner list in collection
 * Method: GET
 * 
 * @param {*} req
 *    contract: Collection Contract Address
 * @param {*} res
 *    Array<IPerson>
      interface IPerson {
        _id?: string;                   // user id
        backgroundUrl: string;          // background image url
        photoUrl: string;               // photo image url
        wallet: string;                 // wallet address
        joinedDate: Date;               // joined date
        name: string;                   // display name

        nfts: Array<INFT>;              // owned nfts
        created: Array<INFT>;           // created nfts
        favourites: Array<INFT>;        // favourite nfts
        history: Array<IHistory>;       // activities of current user
      }
 */
export const getOwners = async (req: FastifyRequest, res: FastifyReply) => {
  const contract = req.params['contract'] as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.getOwners(contract);
  res.send(result);
};

/**
 * Get transfer history of NFT items in collection
 * Method: GET
 * 
 * @param {*} req
 *    contract: Collection Contract Address
 * @param {*} res
 *    Array<IHistory>
      interface IHistory {
        _id?: string;                   // id of activity
        collection: string;             // collection contract address
        nftId: string;                  // id of nft item
        type: string;                   // type of activity (ex; list, offer, etc)
        price: number;                  // price of activity
        from: IPerson;                  // original owner
        to: IPerson;                    // new owner
        date: Date;                     // date of activity
      }
 */
export const getHistory = async (req: FastifyRequest, res: FastifyReply) => {
  const contract = req.params['contract'] as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.getHistory(contract);
  res.send(result);
};

/**
 * Get all activities (bids and transfer) of NFT items in collection
 * Method: GET
 * 
 * @param {*} req
 *     contract: Collection Contract Address
 * @param {*} res
 *      Array<IBid>
        interface IBid {
          _id?: string                    // id of activity
          collection: string;             // collection contract address
          bidder: IPerson;                // bidder user
          bidPrice: number;               // bid price
          status: string;                 // current status of bid
          bidOn: string;                  // id of NFT item
          type: string;                   // type of bid
        }
 */
export const getActivities = async (req: FastifyRequest, res: FastifyReply) => {
  const contract = req.params['contract'] as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.getActivity(contract);
  res.send(result);
};

/**
 * Create new collection - save to MongoDB
 * Method: POST
 * 
 * @param req 
 *    contract: Collection Contract Address
 *    name:     Collection Name
 * @param res 
 *    result of creation
 *      success:  201
 *      fail:     501
 */
export const createCollection = async (req: FastifyRequest, res: FastifyReply) => {
  const { contract, name } = req.body as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.createCollection(contract, name);
  res.send(result);
}

/**
 * Owner place a bid to the NFT item in collection
 * Method: POST
 * 
 * @param {*} req
 *    contract: Collection Contract Address
 *    nftId:    Index of NFT item in collection
 *    from:     Bidder wallet address
 *    price:    Bid price
 *    type:     Bid type
 * @param {*} res
 *    success:  201
 *    fail:     501
 */
 export const placeBid = async (req: FastifyRequest, res: FastifyReply) => {
  const {contract, nftId, from, price, type} = req.body as any;
  const ctl = new NFTCollectionController();
  const result = await ctl.placeBid(contract, nftId, from, price, type);
  res.send(result);
};
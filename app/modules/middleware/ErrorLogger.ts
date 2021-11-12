import { config } from "../../config/config";
import { LogController } from "../controller/LogController";

/**
 * Logs errors thrown in a request
 *
 * @param {*} req
 * @param {*} res
 * @param {*} error
 * @param {*} done
 */
export const ErrorLogger = (req, res, error, done) => {
  if (config.logging) {
    config.__logPool.push({
      type: "GLOBAL_CATCHER",
      request: {
        body: req.body,
        params: req.params,
        context: req.context.config,
      },
      error: error.message,
    });
  }
  done();
};

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Track the trade of a commodity from one trader to another
 * @param {org.acme.trading.Trade} trade - the trade to be processed
 * @transaction
 */
function tradeCommodity(trade) {

    // set the new owner of the commodity
    trade.commodity.owner = trade.newOwner;
    return getAssetRegistry('org.acme.trading.Commodity')
        .then(function (assetRegistry) {

            // emit a notification that a trade has occurred
            var tradeNotification = getFactory().newEvent('org.acme.trading', 'TradeNotification');
            tradeNotification.commodity = trade.commodity;
            emit(tradeNotification);

            // persist the state of the commodity
            return assetRegistry.update(trade.commodity);
        });
}


/**
 * 
 * @param {org.acme.trading.TraderById} tradeById - the trade to be processed
 * @transaction
 */
function TradeById(tradeById){
    var commodityRegistry;
    return getAssetRegistry('org.acme.trading.Commodity')
    .then(function(registry){
        commodityRegistry=registry;
        return commodityRegistry.get(tradeById.tradingSymbol);
    })
    .then(function(result){
        result.quantity-=tradeById.qty;
        return commodityRegistry.update(result);
    });

}

/**
 * Remove all high volume commodities
 * @param {org.acme.trading.RemoveHighQuantityCommodities} remove - the remove to be processed
 * @transaction
 */
function removeHighQuantityCommodities(remove) {

    return getAssetRegistry('org.acme.trading.Commodity')
        .then(function (assetRegistry) {
            return query('selectCommoditiesWithHighQuantity')
                    .then(function (results) {

                        var promises = [];

                        for (var n = 0; n < results.length; n++) {
                            var trade = results[n];

                            // emit a notification that a trade was removed
                            var removeNotification = getFactory().newEvent('org.acme.trading', 'RemoveNotification');
                            removeNotification.commodity = trade;
                            emit(removeNotification);

                            // remove the commodity
                            promises.push(assetRegistry.remove(trade));
                        }

                        // we have to return all the promises
                        return Promise.all(promises);
                    });
        });
}

/**
 * Remove all high volume commodities
 * @param {org.acme.trading._demoSetup} remove - the remove to be processed
 * @transaction
 */
function setup(){
    var factory = getFactory();
 	var NS = 'org.acme.trading';
    var traders = [
      factory.newResource(NS,'Trader','CAROLINE'),
      factory.newResource(NS,'Trader','TRACY'),
      factory.newResource(NS,'Trader','TOM'),
      factory.newResource(NS,'Trader','WHOLESALER')
    ];
    
                          
    var commodities = [
      factory.newResource(NS,'Commodity','Ag'),
      factory.newResource(NS,'Commodity','Pb'),
      factory.newResource(NS,'Commodity','Fe'),
      factory.newResource(NS,'Commodity','Cu')
      ];
 
    /* add the resource and the traders */
    return getParticipantRegistry(NS+'.Trader')
  .then(function(traderRegistry){
            traders.forEach(function(trader) {
         
          trader.firstName = trader.getIdentifier().toLowerCase();
          trader.lastName = 'Trader';
      });
      return traderRegistry.addAll(traders);
    })
  .then(function(){
    	return getAssetRegistry(NS+'.Commodity');
    })
  .then(function(assetRegistry){
      var qty=5;
      commodities.forEach(function(commodity) {
        commodity.description='A lot of '+commodity.getIdentifier();
        commodity.mainExchange='Hursley';
        commodity.quantity = (qty);
        commodity.owner = factory.newRelationship(NS,'Trader','WHOLESALER');
        qty+=10;
      })
      return assetRegistry.addAll(commodities);
    });
  
}

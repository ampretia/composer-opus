# Commodity Network

> This Business Network illustrates commodity trading.

This business network defines:

**Participant**
`Regulator`

**Participant**
`Trader`

**Asset**
`Commodity`

**Transaction(s)**
`Transaction`

**Event**
`TradeNotification `

To test this Business Network Definition in the **Test** tab:

Create two `Trader` participants:

```
{
  "$class": "org.acme.trading.Trader",
  "tradeId": "TRADER1",
  "firstName": "Jenny",
  "lastName": "Jones"
}
```

```
{
  "$class": "org.acme.trading.Trader",
  "tradeId": "TRADER2",
  "firstName": "Amy",
  "lastName": "Williams"
}
```

Create a `Commodity` asset:

```
{
  "$class": "org.acme.trading.Commodity",
  "tradingSymbol": "ABC",
  "description": "Test commodity",
  "mainExchange": "Euronext",
  "quantity": 72.297,
  "owner": "resource:org.acme.trading.Trader#TRADER1"
}
```

Submit a `Trade` transaction:

```
{
  "$class": "org.acme.trading.Trade",
  "commodity": "resource:org.acme.trading.Commodity#ABC",
  "newOwner": "resource:org.acme.trading.Trader#TRADER2"
}
```

After submitting this transaction, you should now see the transaction in the transaction registry. As a result, the owner of the commodity `ABC` should now be owned `TRADER2` in the Asset Registry.

Congratulations!


# Summaries

## Asset Definition 
| Namespace | Name | Description |
| --------  | ---- | ----------- |
| org.hyperledger.composer.system.Asset | Asset | An asset named Asset  |
| org.hyperledger.composer.system.Registry | Registry | An asset named Registry  |
| org.hyperledger.composer.system.AssetRegistry | AssetRegistry | An asset named AssetRegistry  |
| org.hyperledger.composer.system.ParticipantRegistry | ParticipantRegistry | An asset named ParticipantRegistry  |
| org.hyperledger.composer.system.TransactionRegistry | TransactionRegistry | An asset named TransactionRegistry  |
| org.hyperledger.composer.system.Network | Network | An asset named Network  |
| org.hyperledger.composer.system.HistorianRecord | HistorianRecord | An asset named HistorianRecord  |
| org.hyperledger.composer.system.Identity | Identity | An asset named Identity  |
| org.acme.trading.Commodity | Commodity | An asset named Commodity  |


## Transaction Definition 
| Namespace | Name | Description |
| --------  | ---- | ----------- |
| org.hyperledger.composer.system.Transaction | Transaction | A transaction named Transaction  |
| org.hyperledger.composer.system.RegistryTransaction | RegistryTransaction | A transaction named RegistryTransaction  |
| org.hyperledger.composer.system.AssetTransaction | AssetTransaction | A transaction named AssetTransaction  |
| org.hyperledger.composer.system.ParticipantTransaction | ParticipantTransaction | A transaction named ParticipantTransaction  |
| org.hyperledger.composer.system.AddAsset | AddAsset | A transaction named AddAsset  |
| org.hyperledger.composer.system.UpdateAsset | UpdateAsset | A transaction named UpdateAsset  |
| org.hyperledger.composer.system.RemoveAsset | RemoveAsset | A transaction named RemoveAsset  |
| org.hyperledger.composer.system.AddParticipant | AddParticipant | A transaction named AddParticipant  |
| org.hyperledger.composer.system.UpdateParticipant | UpdateParticipant | A transaction named UpdateParticipant  |
| org.hyperledger.composer.system.RemoveParticipant | RemoveParticipant | A transaction named RemoveParticipant  |
| org.hyperledger.composer.system.IssueIdentity | IssueIdentity | A transaction named IssueIdentity  |
| org.hyperledger.composer.system.BindIdentity | BindIdentity | A transaction named BindIdentity  |
| org.hyperledger.composer.system.ActivateCurrentIdentity | ActivateCurrentIdentity | A transaction named ActivateCurrentIdentity  |
| org.hyperledger.composer.system.RevokeIdentity | RevokeIdentity | A transaction named RevokeIdentity  |
| org.acme.trading.Trade | Trade | A transaction named Trade  |
| org.acme.trading.TraderById | TraderById | A transaction named TraderById  |
| org.acme.trading.BulkTrade | BulkTrade | A transaction named BulkTrade  |
| org.acme.trading.RemoveHighQuantityCommodities | RemoveHighQuantityCommodities | A transaction named RemoveHighQuantityCommodities  |
| org.acme.trading._demoSetup | _demoSetup | A transaction named _demoSetup  |


## Participant Definition 
| Namespace | Name | Description |
| --------  | ---- | ----------- |
| org.hyperledger.composer.system.Participant | Participant | An participant named Participant  |
| org.acme.trading.Trader | Trader | An participant named Trader  |
| org.acme.trading.Regulator | Regulator | An participant named Regulator  |


## ACL 


# Detail

### Transaction Functions



*Identifier* lib/logic.js
*Functions*

#### tradeCommodity

```javascript
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
``` 

![tradeCommodity](tradeCommodity.svg)


#### TradeById

```javascript
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
``` 

![TradeById](TradeById.svg)


#### removeHighQuantityCommodities

```javascript
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
``` 

![removeHighQuantityCommodities](removeHighQuantityCommodities.svg)


#### setup

```javascript
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
``` 

![setup](setup.svg)




### Asset Model


#### Asset
**org.hyperledger.composer.system.Asset** - **An asset named Asset**

| Name | Type | Description |
| --------  | ---- | ----------- |


#### Registry
**org.hyperledger.composer.system.Registry** - **An asset named Registry**

| Name | Type | Description |
| --------  | ---- | ----------- |
|registryId|string|The instance identifier for this type|
|name|string||
|type|string||
|system|boolean||


#### AssetRegistry
**org.hyperledger.composer.system.AssetRegistry** - **An asset named AssetRegistry**

| Name | Type | Description |
| --------  | ---- | ----------- |
|registryId|string|The instance identifier for this type|
|name|string||
|type|string||
|system|boolean||


#### ParticipantRegistry
**org.hyperledger.composer.system.ParticipantRegistry** - **An asset named ParticipantRegistry**

| Name | Type | Description |
| --------  | ---- | ----------- |
|registryId|string|The instance identifier for this type|
|name|string||
|type|string||
|system|boolean||


#### TransactionRegistry
**org.hyperledger.composer.system.TransactionRegistry** - **An asset named TransactionRegistry**

| Name | Type | Description |
| --------  | ---- | ----------- |
|registryId|string|The instance identifier for this type|
|name|string||
|type|string||
|system|boolean||


#### Network
**org.hyperledger.composer.system.Network** - **An asset named Network**

| Name | Type | Description |
| --------  | ---- | ----------- |
|networkId|string|The instance identifier for this type|


#### HistorianRecord
**org.hyperledger.composer.system.HistorianRecord** - **An asset named HistorianRecord**

| Name | Type | Description |
| --------  | ---- | ----------- |
|transactionId|string|The instance identifier for this type|
|transactionType|string||
|transactionInvoked|string|The identifier of an instance of org.hyperledger.composer.system.Transaction|
|participantInvoking|string|The identifier of an instance of org.hyperledger.composer.system.Participant|
|identityUsed|string|The identifier of an instance of org.hyperledger.composer.system.Identity|
|eventsEmitted|array||
|transactionTimestamp|string||


#### Identity
**org.hyperledger.composer.system.Identity** - **An asset named Identity**

| Name | Type | Description |
| --------  | ---- | ----------- |
|identityId|string|The instance identifier for this type|
|name|string||
|issuer|string||
|certificate|string||
|state|enum||
|participant|string|The identifier of an instance of org.hyperledger.composer.system.Participant|


#### Commodity
**org.acme.trading.Commodity** - **An asset named Commodity**

| Name | Type | Description |
| --------  | ---- | ----------- |
|tradingSymbol|string|The instance identifier for this type|
|description|string||
|mainExchange|string||
|quantity|number||
|owner|string|The identifier of an instance of org.acme.trading.Trader|



### ACLs


### Queries

still to do


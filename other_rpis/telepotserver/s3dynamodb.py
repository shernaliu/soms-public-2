from __future__ import print_function # Python 2/3 compatibility
import boto3
import json
import decimal
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

dynamodb = boto3.resource("dynamodb", region_name='<insert your region>', endpoint_url="<insert your endpoint>")

table = dynamodb.Table('<insert your table>')

def readDynamoDBItem(inRoom):
    try:
        response = table.get_item(
            Key={
                'room': str(inRoom)
            }
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return "Error in getting item from dynamodb"
    else:
        item = response['Item']
        print("GetItem succeeded:")
        #mItem = json.dumps(item, indent=4, cls=DecimalEncoder)
        return str(item['entered'])
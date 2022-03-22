import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';
import { handleError } from './middleware/HttpError';
import { v4 } from 'uuid';
import * as yup from 'yup';

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'ItemsTable';

export const headers = {
  'content-type': 'application/json',
};

const schema = yup.object().shape({
  label: yup.string().required(),
  completed: yup.bool().required(),
});

export const createItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const item = {
      ...reqBody,
      itemID: v4(),
    };

    await docClient
      .put({
        TableName: tableName,
        Item: item,
      })
      .promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(item),
    };
  } catch (e) {
    return handleError(e);
  }
};

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';
import { handleError, HttpError } from './middleware/HttpError';
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

const fetchItemById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        itemID: id,
      },
    })
    .promise();

  if (!output.Item) {
    throw new HttpError(404, { error: 'not found' });
  }

  return output.Item;
};

export const getItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const item = await fetchItemById(event.pathParameters?.id as string);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(item),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const updateItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchItemById(id);

    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const item = {
      ...reqBody,
      itemID: id,
    };

    await docClient
      .put({
        TableName: tableName,
        Item: item,
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(item),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const deleteItem = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchItemById(id);

    await docClient
      .delete({
        TableName: tableName,
        Key: {
          itemID: id,
        },
      })
      .promise();

    return {
      statusCode: 204,
      body: JSON.stringify('Item deleted successfully!'),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const getAllItems = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const output = await docClient
    .scan({
      TableName: tableName,
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output.Items),
  };
};

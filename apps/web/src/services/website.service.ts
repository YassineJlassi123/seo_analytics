import { client, createApiClient } from "@/lib/api";
import { InferResponseType } from "hono";


type WebsitesResponse = InferResponseType<typeof client.api.websites.$get>;
type WebsitesSuccessResponse = Extract<WebsitesResponse, { success: true }>;
export type WebsiteType = WebsitesSuccessResponse['data'][number];

type WebsiteByIdResponse = InferResponseType<typeof client.api.websites[':id']['$get']>;
export type WebsiteWithReportsType = Extract<WebsiteByIdResponse, { success: true }>['data'];

type CreateWebsiteResponse = InferResponseType<typeof client.api.websites.$post>;
export type CreateWebsiteType = Extract<CreateWebsiteResponse, { success: true }>['data'];

// Enhanced error handling helper
const handleApiError = async (response: Response, operation: string) => {
  console.error(`API Error - ${operation}:`, {
    status: response.status,
    statusText: response.statusText,
    url: response.url
  });

  try {
    const errorData = await response.json();
    console.error('Error response data:', errorData);
    
    if (errorData.message) {
      throw new Error(`${operation} failed: ${errorData.message}`);
    } else if (errorData.error) {
      throw new Error(`${operation} failed: ${errorData.error}`);
    } else {
      throw new Error(`${operation} failed with status ${response.status}`);
    }
  } catch (jsonError) {
    console.error('Failed to parse error response as JSON:', jsonError);
    throw new Error(`${operation} failed with status ${response.status}: ${response.statusText}`);
  }
};

export const getUserWebsites = async (token: string): Promise<WebsiteType[]> => {
  try {
    const apiClient = createApiClient(token);
    const res = await apiClient.api.websites.$get();
    
    if (!res.ok) {
      await handleApiError(res, 'Fetch websites');
    }
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch websites');
    }
    
    return data.data;
  } catch (error) {
    console.error('getUserWebsites error:', error);
    throw error;
  }
};

export const getWebsiteById = async (token: string, id: string): Promise<WebsiteWithReportsType> => {
  try {
    const apiClient = createApiClient(token);
    const res = await apiClient.api.websites[':id'].$get({ 
      param: { id } 
    });
    
    if (!res.ok) {
      await handleApiError(res, 'Fetch website details');
    }
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch website details');
    }
    
    return data.data;
  } catch (error) {
    console.error('getWebsiteById error:', error);
    throw error;
  }
};

export const createWebsite = async (
  token: string, 
  websiteData: { 
    url: string; 
    name?: string; 
    cron?: string 
  }
): Promise<CreateWebsiteType> => {
  try {
    const apiClient = createApiClient(token);
    const res = await apiClient.api.websites.$post({
      json: websiteData,
    });
    if (!res.ok) {
      await handleApiError(res, 'Create website');
    }
    
    const responseData = await res.json();    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to create website');
    }
    
    return responseData.data;
  } catch (error) {
    console.error('createWebsite error:', error);
    throw error;
  }
};
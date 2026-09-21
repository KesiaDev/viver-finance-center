import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Shared Drive ID
const SHARED_DRIVE_ID = '0AGkTdryDwa5oUk9PVA';
const REEMBOLSOS_FOLDER_NAME = 'Reembolsos';

// Create JWT for Google API authentication with write scope
async function createJWT(serviceAccount: ServiceAccountKey): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${claimB64}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

// Get access token from Google
async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const jwt = await createJWT(serviceAccount);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token error:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search for folder by name in Shared Drive
async function findFolder(accessToken: string, folderName: string, parentId: string): Promise<string | null> {
  const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${SHARED_DRIVE_ID}`;
  
  console.log(`Searching for folder: ${folderName} in parent: ${parentId}`);
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Find folder error:', error);
    throw new Error(`Failed to search folder: ${error}`);
  }

  const data = await response.json();
  console.log('Find folder result:', data);
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

// Create folder in Google Drive
async function createFolder(accessToken: string, folderName: string, parentId: string): Promise<string> {
  console.log(`Creating folder: ${folderName} in parent: ${parentId}`);
  
  const response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Create folder error:', error);
    throw new Error(`Failed to create folder: ${error}`);
  }

  const data = await response.json();
  console.log('Created folder:', data);
  return data.id;
}

// Convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

// Upload file to Google Drive
async function uploadFile(
  accessToken: string, 
  fileContent: ArrayBuffer, 
  fileName: string, 
  folderId: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  console.log(`Uploading file: ${fileName} to folder: ${folderId}`);
  
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataString = JSON.stringify(metadata);
  const fileBase64 = arrayBufferToBase64(fileContent);

  const requestBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadataString +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileBase64 +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error}`);
  }

  const data = await response.json();
  console.log('Uploaded file:', data);
  return data.id;
}

// Sanitize filename by removing special characters
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

// Format date as YYYY-MM-DD
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Format value as decimal string (e.g., 150.00)
function formatValue(value: number): string {
  return value.toFixed(2);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
    }

    const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountKeyJson);
    console.log('Service account loaded:', serviceAccount.client_email);

    const { reembolsoId, nome, data, valor, arquivoUrls } = await req.json();
    
    console.log('Export reembolso request:', { reembolsoId, nome, data, valor, arquivoUrls });

    if (!reembolsoId || !nome || !data || valor === undefined || !arquivoUrls || arquivoUrls.length === 0) {
      throw new Error('Missing required fields: reembolsoId, nome, data, valor, arquivoUrls');
    }

    // Get access token with write permissions
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtained');

    // Check if Reembolsos folder exists in Shared Drive, create if not
    let reembolsosFolderId = await findFolder(accessToken, REEMBOLSOS_FOLDER_NAME, SHARED_DRIVE_ID);
    
    if (!reembolsosFolderId) {
      console.log(`Folder ${REEMBOLSOS_FOLDER_NAME} not found in Shared Drive, creating...`);
      reembolsosFolderId = await createFolder(accessToken, REEMBOLSOS_FOLDER_NAME, SHARED_DRIVE_ID);
    } else {
      console.log(`Folder ${REEMBOLSOS_FOLDER_NAME} found: ${reembolsosFolderId}`);
    }

    // Initialize Supabase client for downloading files from storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const uploadedFiles: string[] = [];
    const sanitizedNome = sanitizeFileName(nome);
    const formattedDate = formatDate(data);
    const formattedValor = formatValue(valor);

    // Process each attachment URL
    for (let i = 0; i < arquivoUrls.length; i++) {
      const arquivoUrl = arquivoUrls[i];
      console.log(`Processing file ${i + 1}/${arquivoUrls.length}: ${arquivoUrl}`);

      // Extract storage path from URL
      const urlParts = arquivoUrl.split('/storage/v1/object/public/reembolsos/');
      if (urlParts.length !== 2) {
        console.error('Invalid storage URL format:', arquivoUrl);
        continue;
      }
      const storagePath = decodeURIComponent(urlParts[1]);
      console.log('Storage path:', storagePath);

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('reembolsos')
        .download(storagePath);

      if (downloadError) {
        console.error('Download error:', downloadError);
        continue;
      }

      const fileContent = await fileData.arrayBuffer();
      console.log('File downloaded, size:', fileContent.byteLength);

      // Generate filename: DATA_NOME_VALOR_N.pdf (N is index if multiple files)
      const suffix = arquivoUrls.length > 1 ? `_${i + 1}` : '';
      const fileName = `${formattedDate}_${sanitizedNome}_${formattedValor}${suffix}.pdf`;
      
      // Upload to Google Drive
      const fileId = await uploadFile(accessToken, fileContent, fileName, reembolsosFolderId);
      uploadedFiles.push(fileId);
      console.log(`File uploaded successfully: ${fileName} (${fileId})`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${uploadedFiles.length} arquivo(s) exportado(s) para o Drive`,
        folderId: reembolsosFolderId,
        fileIds: uploadedFiles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in google-drive-export-reembolsos:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

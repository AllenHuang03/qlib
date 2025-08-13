"""
Cloud Storage Service for Qlib Pro
Handles file uploads, downloads, and storage management with AWS S3/Azure Blob integration
"""
import os
import hashlib
import mimetypes
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, BinaryIO
from pathlib import Path
import tempfile

# Try to import cloud storage libraries
try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_AVAILABLE = True
except ImportError:
    print("AWS SDK not available. Install with: pip install boto3")
    AWS_AVAILABLE = False

try:
    from azure.storage.blob import BlobServiceClient
    AZURE_AVAILABLE = True
except ImportError:
    print("Azure SDK not available. Install with: pip install azure-storage-blob")
    AZURE_AVAILABLE = False

logger = logging.getLogger(__name__)

class CloudStorageService:
    """Service for managing cloud file storage"""
    
    def __init__(self):
        self.provider = self._determine_provider()
        self.local_storage_path = Path(__file__).parent / "uploads"
        self.local_storage_path.mkdir(exist_ok=True)
        
        # Storage limits
        self.max_file_size = 100 * 1024 * 1024  # 100MB
        self.max_total_storage = 1024 * 1024 * 1024  # 1GB per user
        self.allowed_extensions = {
            '.csv', '.xlsx', '.xls', '.json', '.txt',
            '.pdf', '.jpg', '.jpeg', '.png', '.gif',
            '.zip', '.pkl', '.h5', '.parquet'
        }
        
        self._initialize_provider()
    
    def _determine_provider(self) -> str:
        """Determine which cloud provider to use"""
        if os.getenv('AWS_ACCESS_KEY_ID') and AWS_AVAILABLE:
            return 'aws'
        elif os.getenv('AZURE_STORAGE_CONNECTION_STRING') and AZURE_AVAILABLE:
            return 'azure'
        else:
            return 'local'
    
    def _initialize_provider(self):
        """Initialize the selected cloud provider"""
        if self.provider == 'aws':
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
            self.bucket_name = os.getenv('AWS_S3_BUCKET', 'qlib-pro-storage')
            logger.info("AWS S3 storage initialized")
            
        elif self.provider == 'azure':
            connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
            self.blob_client = BlobServiceClient.from_connection_string(connection_string)
            self.container_name = os.getenv('AZURE_CONTAINER_NAME', 'qlib-pro-storage')
            logger.info("Azure Blob storage initialized")
            
        else:
            logger.info("Local storage initialized")
    
    def upload_file(self, file_data: bytes, filename: str, user_id: str,
                   content_type: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Upload a file to cloud storage"""
        
        # Validate file
        validation_result = self._validate_file(file_data, filename, user_id)
        if not validation_result['valid']:
            raise ValueError(validation_result['error'])
        
        # Generate unique file ID
        file_id = self._generate_file_id(filename, user_id)
        file_key = f"users/{user_id}/files/{file_id}"
        
        # Determine content type
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            content_type = content_type or 'application/octet-stream'
        
        # Prepare metadata
        file_metadata = {
            'original_filename': filename,
            'user_id': user_id,
            'upload_time': datetime.now().isoformat(),
            'size': len(file_data),
            'content_type': content_type,
            'file_hash': hashlib.sha256(file_data).hexdigest()
        }
        if metadata:
            file_metadata.update(metadata)
        
        try:
            # Upload based on provider
            if self.provider == 'aws':
                upload_result = self._upload_to_s3(file_data, file_key, content_type, file_metadata)
            elif self.provider == 'azure':
                upload_result = self._upload_to_azure(file_data, file_key, content_type, file_metadata)
            else:
                upload_result = self._upload_to_local(file_data, file_key, file_metadata)
            
            return {
                'file_id': file_id,
                'file_key': file_key,
                'filename': filename,
                'size': len(file_data),
                'content_type': content_type,
                'upload_time': file_metadata['upload_time'],
                'download_url': upload_result.get('download_url'),
                'provider': self.provider,
                'metadata': file_metadata
            }
            
        except Exception as e:
            logger.error(f"File upload error: {e}")
            raise Exception(f"Upload failed: {str(e)}")
    
    def _upload_to_s3(self, file_data: bytes, file_key: str, 
                     content_type: str, metadata: Dict) -> Dict[str, Any]:
        """Upload file to AWS S3"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_data,
                ContentType=content_type,
                Metadata={k: str(v) for k, v in metadata.items()},
                ServerSideEncryption='AES256'
            )
            
            # Generate presigned URL for download
            download_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=3600  # 1 hour
            )
            
            return {'download_url': download_url}
            
        except ClientError as e:
            raise Exception(f"S3 upload error: {e}")
    
    def _upload_to_azure(self, file_data: bytes, file_key: str,
                        content_type: str, metadata: Dict) -> Dict[str, Any]:
        """Upload file to Azure Blob Storage"""
        try:
            blob_client = self.blob_client.get_blob_client(
                container=self.container_name, 
                blob=file_key
            )
            
            blob_client.upload_blob(
                file_data,
                content_type=content_type,
                metadata=metadata,
                overwrite=True
            )
            
            # Generate SAS URL for download
            download_url = blob_client.url
            
            return {'download_url': download_url}
            
        except Exception as e:
            raise Exception(f"Azure upload error: {e}")
    
    def _upload_to_local(self, file_data: bytes, file_key: str, metadata: Dict) -> Dict[str, Any]:
        """Upload file to local storage"""
        try:
            file_path = self.local_storage_path / file_key.replace('/', '_')
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Write metadata
            metadata_path = file_path.with_suffix('.meta.json')
            with open(metadata_path, 'w') as f:
                import json
                json.dump(metadata, f, indent=2)
            
            return {'download_url': f'/api/storage/download/{file_key.replace("/", "_")}'}
            
        except Exception as e:
            raise Exception(f"Local upload error: {e}")
    
    def download_file(self, file_key: str, user_id: str) -> Dict[str, Any]:
        """Download a file from storage"""
        # Verify user owns the file
        if not file_key.startswith(f'users/{user_id}/'):
            raise PermissionError("Access denied to file")
        
        try:
            if self.provider == 'aws':
                return self._download_from_s3(file_key)
            elif self.provider == 'azure':
                return self._download_from_azure(file_key)
            else:
                return self._download_from_local(file_key)
                
        except Exception as e:
            logger.error(f"File download error: {e}")
            raise Exception(f"Download failed: {str(e)}")
    
    def _download_from_s3(self, file_key: str) -> Dict[str, Any]:
        """Download file from AWS S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
            return {
                'content': response['Body'].read(),
                'content_type': response.get('ContentType', 'application/octet-stream'),
                'metadata': response.get('Metadata', {})
            }
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise FileNotFoundError("File not found")
            raise Exception(f"S3 download error: {e}")
    
    def _download_from_azure(self, file_key: str) -> Dict[str, Any]:
        """Download file from Azure Blob Storage"""
        try:
            blob_client = self.blob_client.get_blob_client(
                container=self.container_name,
                blob=file_key
            )
            
            blob_data = blob_client.download_blob()
            properties = blob_client.get_blob_properties()
            
            return {
                'content': blob_data.readall(),
                'content_type': properties.content_settings.content_type,
                'metadata': properties.metadata or {}
            }
        except Exception as e:
            raise Exception(f"Azure download error: {e}")
    
    def _download_from_local(self, file_key: str) -> Dict[str, Any]:
        """Download file from local storage"""
        try:
            file_path = self.local_storage_path / file_key.replace('/', '_')
            metadata_path = file_path.with_suffix('.meta.json')
            
            if not file_path.exists():
                raise FileNotFoundError("File not found")
            
            # Read file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Read metadata
            metadata = {}
            if metadata_path.exists():
                import json
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            
            content_type = metadata.get('content_type', 'application/octet-stream')
            
            return {
                'content': content,
                'content_type': content_type,
                'metadata': metadata
            }
            
        except Exception as e:
            raise Exception(f"Local download error: {e}")
    
    def list_user_files(self, user_id: str, prefix: str = '') -> List[Dict[str, Any]]:
        """List files for a user"""
        try:
            if self.provider == 'aws':
                return self._list_s3_files(user_id, prefix)
            elif self.provider == 'azure':
                return self._list_azure_files(user_id, prefix)
            else:
                return self._list_local_files(user_id, prefix)
                
        except Exception as e:
            logger.error(f"File listing error: {e}")
            return []
    
    def _list_s3_files(self, user_id: str, prefix: str = '') -> List[Dict[str, Any]]:
        """List files in S3"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f'users/{user_id}/files/{prefix}'
            )
            
            files = []
            for obj in response.get('Contents', []):
                # Get object metadata
                head_response = self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=obj['Key']
                )
                
                files.append({
                    'file_key': obj['Key'],
                    'filename': head_response['Metadata'].get('original_filename', obj['Key'].split('/')[-1]),
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'content_type': head_response.get('ContentType', 'application/octet-stream'),
                    'metadata': head_response.get('Metadata', {})
                })
            
            return files
            
        except ClientError:
            return []
    
    def _list_azure_files(self, user_id: str, prefix: str = '') -> List[Dict[str, Any]]:
        """List files in Azure Blob Storage"""
        try:
            container_client = self.blob_client.get_container_client(self.container_name)
            blobs = container_client.list_blobs(name_starts_with=f'users/{user_id}/files/{prefix}')
            
            files = []
            for blob in blobs:
                files.append({
                    'file_key': blob.name,
                    'filename': blob.metadata.get('original_filename', blob.name.split('/')[-1]),
                    'size': blob.size,
                    'last_modified': blob.last_modified.isoformat(),
                    'content_type': blob.content_settings.content_type,
                    'metadata': blob.metadata or {}
                })
            
            return files
            
        except Exception:
            return []
    
    def _list_local_files(self, user_id: str, prefix: str = '') -> List[Dict[str, Any]]:
        """List files in local storage"""
        try:
            files = []
            search_pattern = f'users_{user_id}_files_{prefix}*'
            
            for file_path in self.local_storage_path.glob(search_pattern):
                if file_path.suffix == '.json' and file_path.name.endswith('.meta.json'):
                    continue  # Skip metadata files
                
                metadata_path = file_path.with_suffix('.meta.json')
                metadata = {}
                if metadata_path.exists():
                    import json
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                
                files.append({
                    'file_key': file_path.name.replace('_', '/'),
                    'filename': metadata.get('original_filename', file_path.name),
                    'size': file_path.stat().st_size,
                    'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                    'content_type': metadata.get('content_type', 'application/octet-stream'),
                    'metadata': metadata
                })
            
            return files
            
        except Exception:
            return []
    
    def delete_file(self, file_key: str, user_id: str) -> Dict[str, Any]:
        """Delete a file"""
        # Verify user owns the file
        if not file_key.startswith(f'users/{user_id}/'):
            raise PermissionError("Access denied to file")
        
        try:
            if self.provider == 'aws':
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            elif self.provider == 'azure':
                blob_client = self.blob_client.get_blob_client(
                    container=self.container_name,
                    blob=file_key
                )
                blob_client.delete_blob()
            else:
                file_path = self.local_storage_path / file_key.replace('/', '_')
                metadata_path = file_path.with_suffix('.meta.json')
                file_path.unlink(missing_ok=True)
                metadata_path.unlink(missing_ok=True)
            
            return {'status': 'deleted', 'file_key': file_key}
            
        except Exception as e:
            logger.error(f"File deletion error: {e}")
            raise Exception(f"Delete failed: {str(e)}")
    
    def get_user_storage_usage(self, user_id: str) -> Dict[str, Any]:
        """Get user's storage usage statistics"""
        files = self.list_user_files(user_id)
        
        total_size = sum(f['size'] for f in files)
        file_count = len(files)
        
        # Group by file type
        file_types = {}
        for file_info in files:
            ext = Path(file_info['filename']).suffix.lower()
            if ext not in file_types:
                file_types[ext] = {'count': 0, 'size': 0}
            file_types[ext]['count'] += 1
            file_types[ext]['size'] += file_info['size']
        
        return {
            'user_id': user_id,
            'total_files': file_count,
            'total_size': total_size,
            'total_size_mb': round(total_size / 1024 / 1024, 2),
            'max_size_mb': round(self.max_total_storage / 1024 / 1024, 2),
            'usage_percent': round((total_size / self.max_total_storage) * 100, 1),
            'file_types': file_types,
            'provider': self.provider
        }
    
    def _validate_file(self, file_data: bytes, filename: str, user_id: str) -> Dict[str, Any]:
        """Validate file before upload"""
        # Check file size
        if len(file_data) > self.max_file_size:
            return {
                'valid': False,
                'error': f'File too large. Maximum size is {self.max_file_size // 1024 // 1024}MB'
            }
        
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.allowed_extensions:
            return {
                'valid': False,
                'error': f'File type not allowed. Allowed types: {", ".join(self.allowed_extensions)}'
            }
        
        # Check user storage limit
        usage = self.get_user_storage_usage(user_id)
        if usage['total_size'] + len(file_data) > self.max_total_storage:
            return {
                'valid': False,
                'error': f'Storage limit exceeded. Current usage: {usage["total_size_mb"]}MB'
            }
        
        return {'valid': True}
    
    def _generate_file_id(self, filename: str, user_id: str) -> str:
        """Generate unique file ID"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_hash = hashlib.md5(f"{filename}_{user_id}_{timestamp}".encode()).hexdigest()[:8]
        file_ext = Path(filename).suffix.lower()
        return f"{timestamp}_{file_hash}{file_ext}"

# Global cloud storage service instance
cloud_storage_service = CloudStorageService()
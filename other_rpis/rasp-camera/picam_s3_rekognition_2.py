import boto3
import botocore
from picamera import PiCamera
from time import sleep

# Set the filename and bucket name
BUCKET = '<insert your BUCKET>' # replace with your own unique bucket name
location = {'LocationConstraint': '<insert your location>'}
file_path = "/home/pi/Desktop"
file_name = "test1.jpg"

def takePhoto(file_path,file_name):

    with PiCamera() as camera:
        #camera.resolution = (1024, 768)
        full_path = file_path + "/" + file_name
        camera.capture(full_path)
        sleep(3)

def uploadToS3(file_path,file_name,bucket_name,location,s3filepath):
    s3 = boto3.resource('s3') # Create an S3 resource
    exists = True

    try:
        s3.meta.client.head_bucket(Bucket=bucket_name)
    except botocore.exceptions.ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404:
            exists = False

    if exists == False:
        s3.create_bucket(Bucket=bucket_name,CreateBucketConfiguration=location)
    
    # Upload the file
    full_path = file_path + "/" + file_name
    s3.Object(bucket_name, s3filepath).put(ACL="public-read",Body=open(full_path, 'rb'))
    print("File uploaded")


def detect_labels(bucket, key, max_labels=10, min_confidence=90, region="<insert your region>"):
	rekognition = boto3.client("rekognition", region)
	response = rekognition.detect_labels(
		Image={
			"S3Object": {
				"Bucket": bucket,
				"Name": key,
			}
		},
		MaxLabels=max_labels,
		MinConfidence=min_confidence,
	)
	return response['Labels']
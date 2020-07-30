package com.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;

import org.opencv.android.Utils;
import org.opencv.core.MatOfDouble;
import org.opencv.core.Point;
import org.opencv.core.Rect;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import org.opencv.photo.Photo;

import android.graphics.Matrix;
import android.media.Image;
import android.util.Base64;

import java.io.ByteArrayOutputStream;

public class RNOpenCvLibraryModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RNOpenCvLibraryModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNOpenCvLibrary";
    }

    @ReactMethod
    public void blackWhiteFilter(String imageAsBase64, Callback errorCallback, Callback successCallback) {
        try {
            byte[] decodedString = Base64.decode(imageAsBase64, Base64.DEFAULT);
            Bitmap image = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length); // converting base64 to bitmap
            Mat matImage = new Mat();
            Utils.bitmapToMat(image, matImage); // bitmap to Mat
            Imgproc.cvtColor(matImage, matImage, Imgproc.COLOR_BGR2GRAY); // converting to grayscale
            Imgproc.medianBlur(matImage, matImage, 15);
            matImage.convertTo(matImage, CvType.CV_32FC1, 1.0 / 255.0);
            Mat res = CalcBlockMeanVariance(matImage, 21); // finding mean variance
            Core.subtract(new MatOfDouble(1.0), res, res);
            Imgproc.cvtColor( matImage, matImage, Imgproc.COLOR_BGRA2BGR);
            Core.add(matImage, res, res);
            Imgproc.threshold(res, res, 0.90, 1, Imgproc.THRESH_BINARY); // threshold
            res.convertTo(res, CvType.CV_8UC1, 255.0);
            Core.rotate(res, res, Core.ROTATE_90_CLOCKWISE); // rotating by 90
            image = RotateBitmap(image, 90); // rotating original bitmap by 90
            Utils.matToBitmap(res, image); // back to bitmap
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            image.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream .toByteArray();
            String resultImgAsBase64 = Base64.encodeToString(byteArray, Base64.DEFAULT); // bitmap to base64
            successCallback.invoke(resultImgAsBase64); // return to js
        } catch (Exception e) {
            errorCallback.invoke(e.getMessage());
        }
    }
    @ReactMethod
    public void grayScaleFilter(String imageAsBase64, Callback errorCallback, Callback successCallback) {
        try {
            byte[] decodedString = Base64.decode(imageAsBase64, Base64.DEFAULT);
            Bitmap image = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length); // converting base64 to bitmap
            Mat matImage = new Mat();
            Utils.bitmapToMat(image, matImage); // bitmap to Mat
            Imgproc.cvtColor(matImage, matImage, Imgproc.COLOR_BGR2GRAY);
            Core.rotate(matImage, matImage, Core.ROTATE_90_CLOCKWISE); // rotating by 90
            image = RotateBitmap(image, 90);
            Utils.matToBitmap(matImage, image);
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            image.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream .toByteArray();
            String resultImgAsBase64 = Base64.encodeToString(byteArray, Base64.DEFAULT); // bitmap to base64
            successCallback.invoke(resultImgAsBase64);
        }
        catch (Exception e) {
            errorCallback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void corners(String imageAsBase64, Callback errorCallback, Callback successCallback) {
        try {
            byte[] decodedString = Base64.decode(imageAsBase64, Base64.DEFAULT);
            Bitmap image = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length); // converting base64 to bitmap
            Mat matImage = new Mat();
            Utils.bitmapToMat(image, matImage);

        }
        catch(Exception e) {
            errorCallback.invoke(e.getMessage());
        }
    }

    public Mat CalcBlockMeanVariance (Mat Img, int blockSide)
    {
        Mat I = new Mat();
        Mat ResMat;
        Mat inpaintmask = new Mat();
        Mat patch;
        Mat smallImg = new Mat();
        MatOfDouble mean = new MatOfDouble();
        MatOfDouble stddev = new MatOfDouble();

        Img.convertTo(I, CvType.CV_32FC1);
        ResMat = Mat.zeros(Img.rows() / blockSide, Img.cols() / blockSide, CvType.CV_32FC1);

        for (int i = 0; i < Img.rows() - blockSide; i += blockSide)
        {
            for (int j = 0; j < Img.cols() - blockSide; j += blockSide)
            {
                patch = new Mat(I,new Rect(j,i, blockSide, blockSide));
                Core.meanStdDev(patch, mean, stddev);

                if (stddev.get(0,0)[0] > 0.01)
                    ResMat.put(i / blockSide, j / blockSide, mean.get(0,0)[0]);
                else
                    ResMat.put(i / blockSide, j / blockSide, 0);
            }
        }

        Imgproc.resize(I, smallImg, ResMat.size());
        Imgproc.threshold(ResMat, inpaintmask, 0.02, 1.0, Imgproc.THRESH_BINARY);

        Mat inpainted = new Mat();
        Imgproc.cvtColor(smallImg, smallImg, Imgproc.COLOR_RGBA2BGR);
        smallImg.convertTo(smallImg, CvType.CV_8UC1, 255.0);

        inpaintmask.convertTo(inpaintmask, CvType.CV_8UC1);
        Photo.inpaint(smallImg, inpaintmask, inpainted, 5, Photo.INPAINT_TELEA);

        Imgproc.resize(inpainted, ResMat, Img.size());
        ResMat.convertTo(ResMat, CvType.CV_32FC1, 1.0 / 255.0);

        return ResMat;
    }
    public static Bitmap RotateBitmap(Bitmap source, float angle)
    {
        Matrix matrix = new Matrix();
        matrix.postRotate(angle);
        return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
    }
}
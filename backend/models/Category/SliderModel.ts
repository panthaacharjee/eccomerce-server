import mongoose, { Schema, Document } from "mongoose";

export interface ISlider extends Document {
  title: string;
  description: string;
  image: string;
  status: "Published" | "Draft" | "Archive";
  url?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const sliderSchema = new Schema<ISlider>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archive"],
      default: "Draft",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"],
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  },
);

// Optional: Add index for better query performance
sliderSchema.index({ status: 1, order: 1 });

const Slider = mongoose.model<ISlider>("slider", sliderSchema);

export default Slider;

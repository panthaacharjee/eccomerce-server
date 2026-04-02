import mongoose, { Schema, Document, Types } from "mongoose";

// Document interfaces
export interface ISubLabel extends Document {
  title: string;
  createdAt: Date;
}

// Define two interfaces - one for raw, one for populated
export interface ICategory extends Document {
  main_label: string;
  sub_label: Types.ObjectId[]; // Array of ObjectIds, not ISubLabel[]
  category_image: {
    url: string;
  };
  navmenu: boolean;
  category_menu: boolean;
  used_count: number;
  createdAt: Date;
  updatedAt: Date;
}

// Optional: For populated results
export interface ICategoryPopulated extends Omit<ICategory, "sub_label"> {
  sub_label: ISubLabel[];
}

// SubLabel Schema
const subLabelSchema = new Schema<ISubLabel>({
  title: {
    type: String,
    required: [true, "Sub label title is required"],
    trim: true,
    maxlength: [100, "Sub label title cannot exceed 100 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Category Schema
const categorySchema = new Schema<ICategory>(
  {
    main_label: {
      type: String,
      required: [true, "Main label is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Main label cannot exceed 100 characters"],
    },
    sub_label: [
      {
        type: Schema.Types.ObjectId,
        ref: "sub_label",
      },
    ],
    category_image: {
      url: {
        type: String,
        default: "",
        trim: true,
      },
    },
    navmenu: {
      type: Boolean,
      default: false,
    },
    category_menu: {
      type: Boolean,
      default: true,
    },
    used_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create and export the models
export const Category = mongoose.model<ICategory>("category", categorySchema);
export const SubLabel = mongoose.model<ISubLabel>("sub_label", subLabelSchema);

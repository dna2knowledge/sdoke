import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import eventbus from '$/service/eventbus';
import databox from '$/service/databox';
import local from '$/service/local';

const TagDrawer = ({ data: initialData, t }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(initialData || { '-': [] });
  const [selectedTag, setSelectedTag] = useState('-');
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverTag, setDraggedOverTag] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  
  const touchItem = useRef(null);

  const onClose = () => setOpen(false);
  const commit = (data) => databox.stock.setPinnedStockList(data);

  useEffect(() => {
     databox.stock.getPinnedStockList().then(rawList => {
        if (!rawList) rawList = {};
        if (Array.isArray(rawList)) {
           // compatible for old version
           rawList = { '-': rawList };
        }
        setData({...rawList});
     });
  }, []);

  useEffect(() => {
     eventbus.on('stock.pinned.open', onOpen);
     eventbus.on('stock.pinned.add', onStockPinnedAdd);
     return () => {
        eventbus.off('stock.pinned.open', onOpen);
        eventbus.off('stock.pinned.add', onStockPinnedAdd);
     };

     function onOpen(data) {
        setOpen(true);
     }

     function onStockPinnedAdd(evt) {
        if (!evt) return;
        const tag = evt.tag;
        const item = evt.item;
        if (!tag || !item) return;
        if (!data[tag]) data[tag] = [];
        if (!data[tag].some(i => i.code === item.code)) {
           const newdata = {
              ...data,
              [tag]: [...data[tag], item]
           };
           setData(newdata);
           commit(newdata);
        }
     }
  });

  // Add new tag
  const handleAddTag = () => {
    if (newTagName && !data[newTagName]) {
      const newdata = { ...data, [newTagName]: [] }
      setData(newdata);
      commit(newdata);
      setNewTagName('');
      setNewTagDialogOpen(false);
    }
  };

  // Remove tag
  const handleRemoveTag = (tagName) => {
    if (tagName === '-') return;
    const newData = { ...data };
    delete newData[tagName];
    setData(newdata);
    commit(newdata);
    if (selectedTag === tagName) {
      setSelectedTag('-');
    }
  };

  // Remove item from tag
  const handleRemoveItem = (tagName, itemCode) => {
    const newdata = {
      ...data,
      [tagName]: data[tagName].filter(item => item.code !== itemCode)
    };
    setData(newdata);
    commit(newdata);
  };

  // Drag start
  const handleDragStart = (e, item, sourceTag) => {
    setDraggedItem({ item, sourceTag });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag over tag
  const handleDragOverTag = (e, tagName) => {
    e.preventDefault();
    setDraggedOverTag(tagName);
  };

  // Drop on tag (add item to tag)
  const handleDropOnTag = (e, targetTag) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item } = draggedItem;
    
    if (!data[targetTag].some(i => i.code === item.code)) {
      const newdata = {
        ...data,
        [targetTag]: [...data[targetTag], item]
      };
      setData(newdata);
      commit(newdata);
    }

    setDraggedItem(null);
    setDraggedOverTag(null);
  };

  // Drag over item (for reordering)
  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  // Drop on item (reorder)
  const handleDropOnItem = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.sourceTag !== selectedTag) return;

    const { item } = draggedItem;
    const items = [...data[selectedTag]];
    const sourceIndex = items.findIndex(i => i.code === item.code);
    
    if (sourceIndex !== -1) {
      items.splice(sourceIndex, 1);
      items.splice(targetIndex, 0, item);
      
      const newdata = {
        ...data,
        [selectedTag]: items
      };
      setData(newdata);
      commit(newdata);
    }

    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e, item, sourceTag) => {
    touchItem.current = { item, sourceTag };
  };

  const handleTouchMove = (e) => {
    // XXX: BUG - cannot touch move; require {passive: false} by listening directly
    if (touchItem.current) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchItem.current) return;

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      const tagElement = element.closest('[data-tag]');
      const itemElement = element.closest('[data-item-index]');
      
      if (tagElement) {
        const tag = tagElement.getAttribute('data-tag');
        const { item } = touchItem.current;
        
        if (!data[tag].some(i => i.code === item.code)) {
          const newdata = {
            ...data,
            [tag]: [...data[tag], item]
          };
          setData(newdata);
          commit(newdata);
        }
      } else if (itemElement && touchItem.current.sourceTag === selectedTag) {
        const targetIdx = parseInt(itemElement.getAttribute('data-item-index'));
        const items = [...data[selectedTag]];
        const sourceIndex = items.findIndex(i => i.code === touchItem.current.item.code);
        
        if (sourceIndex !== -1) {
          items.splice(sourceIndex, 1);
          items.splice(targetIdx, 0, touchItem.current.item);
          
          const newdata = {
            ...data,
            [selectedTag]: items
          };
          setData(newdata);
          commit(newdata);
        }
      }
    }

    touchItem.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverTag(null);
    setDraggedOverIndex(null);
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { height: '50vh' }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Typography variant="h6">{t('t.bookmarks', 'Bookmarks')}&nbsp;
               <Tooltip title={t('t.bookmark.do.addtag', 'Add Tag')}>
                  <IconButton sx={{ p: '10px' }} onClick={() => setNewTagDialogOpen(true)}><BookmarkAddIcon /></IconButton>
               </Tooltip>
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Tags Column */}
            <Paper 
              elevation={0}
              sx={{ 
                width: '35%', 
                borderRight: 1, 
                borderColor: 'divider', 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <List sx={{ flex: 1, pt: 0 }}>
                {Object.keys(data).map((tagName) => (
                  <ListItem
                    key={tagName}
                    data-tag={tagName}
                    button
                    selected={selectedTag === tagName}
                    onClick={() => setSelectedTag(tagName)}
                    onDragOver={(e) => handleDragOverTag(e, tagName)}
                    onDrop={(e) => handleDropOnTag(e, tagName)}
                    onDragLeave={() => setDraggedOverTag(null)}
                    sx={{
                      bgcolor: draggedOverTag === tagName ? 'primary.light' : 'inherit',
                      transition: 'background-color 0.2s',
                      '&.Mui-selected': {
                        borderLeft: 4,
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <ListItemText 
                      primary={tagName === '-' ? t('t.bookmark.default', '(Default)') : tagName}
                      secondary={t('t.bookmark.number', '{{num}} item(s)', {num: data[tagName].length})}
                    />
                    {(
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tagName);
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Items Column */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedTag === '-' ? t('t.bookmark.default', '(Default)') : selectedTag}
                &nbsp;({t('t.bookmark.number', '{{num}} item(s)', {num: data[selectedTag]?.length || 0})})
              </Typography>
              
              {data[selectedTag]?.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary' 
                }}>
                  <Typography>{t('tip.bookmark.noitem', 'No items in this tag')}</Typography>
                  <Typography variant="body2">
                    {t('tip.bookmark.dragto', 'Drag items from other tags to add them here')}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {data[selectedTag]?.map((item, index) => (
                    <Paper
                      key={item.code}
                      data-item-index={index}
                      draggable
                      onClick={() => eventbus.emit('stock.pinned.click', item)}
                      onDragStart={(e) => handleDragStart(e, item, selectedTag)}
                      onDragOver={(e) => handleDragOverItem(e, index)}
                      onDrop={(e) => handleDropOnItem(e, index)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, item, selectedTag)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      elevation={draggedOverIndex === index ? 4 : 1}
                      sx={{
                        mb: 1.5,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'move',
                        bgcolor: draggedOverIndex === index ? 'action.hover' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          elevation: 3
                        },
                        touchAction: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <DragIndicatorIcon 
                        sx={{ mr: 2, color: 'text.secondary', cursor: 'grab' }} 
                      />
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.code} ({item.area})
                        </Typography>
                      </Box>

                      {selectedTag !== 'basic' && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(selectedTag, item.code)}
                          sx={{ ml: 1 }}
                        >
                          <CloseIcon />
                        </IconButton>
                      )}
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Add Tag Dialog */}
      <Dialog 
        open={newTagDialogOpen} 
        onClose={() => setNewTagDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('t.bookmark.addtag.title', "Add New Tag")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('t.bookmark.addtag.placeholder', "Tag Name")}
            fullWidth
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTagDialogOpen(false)}>{t('t.bookmark.addtag.cancel', 'Cancel')}</Button>
          <Button onClick={handleAddTag} variant="contained">{t('t.bookmark.addtag.add', 'Add')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TagDrawer;

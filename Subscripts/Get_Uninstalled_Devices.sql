SELECT DESCRP, INSTALLED
  FROM LOGICAL_DEV_D
  INNER JOIN LOGICAL_DEV ON LOGICAL_DEV.ID = LOGICAL_DEV_D.ID
  WHERE INSTALLED <> 'Y'